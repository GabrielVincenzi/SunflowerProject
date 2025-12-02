// Casa vecchia http://192.168.1.112:5013
// Casa nuova http://192.168.0.105:5013
// Casa Bolo http://192.168.1.114:5013
// Cell work http://172.20.10.4:5013

// OLD: http://192.168.1.114:5013

const baseUrl = 'http://172.20.10.3:5013'

// Chart GET requests
export const fetchAllChartDetails = async ({
    query,
    category,
    limit,
    afterId,
    signal,
}: {
    query?: string;
    category?: string;
    limit?: number;
    afterId?: number | null;
    signal?: AbortSignal; // optional for cancellation
}): Promise<ApiAllChartResponse> => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set("search", query.trim());
    if (category?.trim()) params.set("category", category.trim());
    if (limit != null) params.set("limit", String(limit));
    if (afterId != null) params.set("afterId", String(afterId));

    const apiUrl =
        params.toString().length > 0
            ? `${baseUrl}/chart/allCharts?${params.toString()}`
            : `${baseUrl}/chart/allCharts`;

    //console.log(apiUrl)
    const response = await fetch(apiUrl, { signal });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    const nextCursorRaw = json?.nextCursor ?? null;
    const nextCursor = nextCursorRaw == null ? null : Number(nextCursorRaw);
    return {
        data,
        nextCursor,
        hasMore: Boolean(json?.hasMore),
        limit: json?.limit ?? data.length,
    };
};

export const fetchRecommendedCharts = async ({
    userId,
    limit,
    afterCursor,
    excludeSeenDays,
    signal,
}: ApiRecommChartParams): Promise<ApiAllChartResponse & { nextCursor?: AfterCursor | null }> => {
    if (!userId?.trim()) throw new Error("userId is required");

    const params = new URLSearchParams();
    params.set("userId", userId.trim());
    if (limit != null) params.set("limit", String(limit));
    if (excludeSeenDays != null) params.set("excludeSeenDays", String(excludeSeenDays));

    if (afterCursor && afterCursor.lastSimilarity != null && afterCursor.lastId != null) {
        params.set("lastSimilarity", String(afterCursor.lastSimilarity));
        params.set("afterId", String(afterCursor.lastId));
    }

    const apiUrl = `${baseUrl}/chart/recommended?${params.toString()}`;
    const res = await fetch(apiUrl, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Map rows
    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    // nextCursor from server is an object { lastSimilarity, lastId } or null
    const nextCursor = json?.nextCursor ?? null;

    return {
        data,
        nextCursor,
        hasMore: Boolean(json?.hasMore),
        limit: json?.limit ?? data.length,
    };
};

export const fetchRandomCharts = async ({
    limit,
    afterCursor,
    signal,
}: ApiRandomChartParams): Promise<ApiAllChartResponse & { nextCursor?: AfterCursorRandom | null }> => {
    if (!limit) throw new Error("Limit is required");

    const params = new URLSearchParams();
    if (limit != null) params.set("limit", String(limit));

    // Only send cursor fields that the simplified API expects
    if (afterCursor) {
        if (afterCursor.seed != null) params.set("seed", String(afterCursor.seed));
        if (afterCursor.lastSortKey != null) params.set("lastSortKey", String(afterCursor.lastSortKey));
        if (afterCursor.lastId != null) params.set("lastId", String(afterCursor.lastId));
    }

    const apiUrl = `${baseUrl}/chart/random?${params.toString()}`;
    const res = await fetch(apiUrl, { signal: signal ?? undefined });
    if (!res.ok) {
        let text: string | undefined;
        try { text = await res.text(); } catch { /* ignore */ }
        throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
    }

    const json = await res.json();

    // Map rows, ensure id is number
    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    // server.nextCursor expected to be { seed, lastSortKey, lastId } or null
    const nextCursor = json?.nextCursor ?? null;

    return {
        data,
        nextCursor,
        hasMore: Boolean(json?.hasMore),
        limit: json?.limit ?? data.length,
    };
};

export const fetchChartData = async ({
    db,
    variables,
    geos,
    startPeriod,
    endPeriod,
}: FetchChartParams): Promise<ApiResponse> => {
    const params = new URLSearchParams();

    params.append("Database", db);
    params.append("Geos", geos);
    params.append("Variables", variables);

    if (startPeriod != null) params.append("StartPeriod", startPeriod);
    if (endPeriod != null) params.append("EndPeriod", endPeriod);

    const apiUrl = `${baseUrl}/chart/getData?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
};



// Database GET requests
export const fetchDbAvailabilities = async ({ db }: { db: string }) => {
    const params = new URLSearchParams({
        Name: db,
    });

    const apiUrl = `${baseUrl}/db?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);
        const data: ApiDbResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        throw error;
    }
};

// Saved GET requests
export const fetchSavedEvents = async (
    userId: string,
    { timeoutMs = 10000 } = {}
): Promise<SavedCardProps[]> => {
    if (!userId) return [];
    const apiUrl = `${baseUrl}/events/saved?userId=${encodeURIComponent(userId)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            signal: controller.signal,
            headers: {
                "Accept": "application/json",
            },
        });

        clearTimeout(timeout);

        const json: ApiSavedEventsResponse = await response.json();

        if (!json || !Array.isArray(json.data)) return [];

        return json.data.map(item => ({
            savedAt: item.savedAt ?? "",
            data: item.data ?? {},
        }));
    } catch (err: any) {
        if (err.name === "AbortError") {
            console.error("fetchSavedEvents aborted (timeout)", apiUrl);
            throw new Error("Request timed out");
        }
        console.error("Error fetching saved events:", err);
        throw err;
    }
};

export const fetchSavedIdsEvents = async (
    userId: string,
    { timeoutMs = 10000 } = {}
): Promise<Set<string>> => {
    if (!userId) return new Set();

    const url = `${baseUrl}/events/savedIds?userId=${encodeURIComponent(userId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const json = await res.json();
        if (!json?.ids) return new Set();

        return new Set(
            json.ids
                .map((v: any) => String(v).trim())
                .filter((s: string) => s.length > 0)
        );
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") throw new Error("Request timed out");
        throw err;
    }
};

// Saved DELETE requests
export const deleteSavedEvent = async ({ userId, objectId }: { userId: string; objectId: string }): Promise<Set<string>> => {
    const params = new URLSearchParams({
        userId: userId,
        objectId: objectId,
    });

    const apiUrl = `${baseUrl}/events/saved/del?${params.toString()}`;
    const payload = { userId, objectId };

    const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Delete failed: ${response.status} ${txt}`);
    }
    return response.json(); // server returns { deleted: rows }
};

// Event (User action on Object) POST requests
export const postNewEvent = async ({ userId, action, objectId, time,
}: {
    userId: string;
    action: string;
    objectId: string;
    time: string; // or Date.toISOString()
}): Promise<Set<string>> => {
    const apiUrl = `${baseUrl}/events/new`;

    const payload = {
        userId,
        action,
        objectId,
        time,
    };

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const data = json?.data ?? json;
    return data;
};


// Questions GET requests
export const fetchUserQuestions = async ({
    userId,
    numQuestions = 1,
}: {
    userId: number;
    numQuestions: number;
}) => {

    const params = new URLSearchParams({
        userId: String(userId),
        numQuestions: String(numQuestions),
    });

    const apiUrl = `${baseUrl}/questions?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);
        const data: ApiUserQuestionsResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching user questions:", error);
        throw error;
    }
};