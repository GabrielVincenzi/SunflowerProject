const baseUrl = "http://172.20.10.3:5013"; //process.env.EXPO_PUBLIC_AZURE_URL?.replace(/\/$/, "");

export type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

// ── Chart GET requests ────────────────────────────────────────────────────────

export const fetchAllChartDetails = async ({
    query,
    category,
    lang,
    limit,
    afterCursor,
    signal,
    authFetch,
}: {
    query?: string;
    category?: string;
    lang?: string;
    limit?: number;
    afterCursor?: number | null;
    signal?: AbortSignal;
    authFetch: AuthFetch;
}): Promise<ApiAllChartResponse> => {

    const params = new URLSearchParams();
    if (query?.trim()) params.set("search", query.trim());
    if (category?.trim()) params.set("category", category.trim());
    if (lang?.trim()) params.set("lang", lang.trim());
    if (limit != null) params.set("limit", String(limit));
    if (afterCursor != null) params.set("afterId", String(afterCursor));

    const apiUrl = params.toString().length > 0
        ? `${baseUrl}/chart/allCharts?${params.toString()}`
        : `${baseUrl}/chart/allCharts`;

    const response = await authFetch(apiUrl, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    console.log(data)

    return {
        data,
        nextCursor: json?.nextCursor == null ? null : Number(json.nextCursor),
        hasMore: Boolean(json?.hasMore),
        limit: json?.limit ?? data.length,
    };
};

export const fetchRecommendedCharts = async ({
    limit,
    lang,
    afterCursor,
    excludeSeenDays,
    signal,
    authFetch,
}: Omit<ApiRecommChartParams, 'userId'>): Promise<ApiAllChartResponse & { nextCursor?: AfterCursor | null }> => {
    const params = new URLSearchParams();
    // userId no longer sent — backend reads it from the JWT
    if (limit != null) params.set("limit", String(limit));
    if (lang?.trim()) params.set("lang", lang.trim());
    if (excludeSeenDays != null) params.set("excludeSeenDays", String(excludeSeenDays));
    if (afterCursor) {
        if (afterCursor.lastSimilarity != null) params.set("lastSimilarity", String(afterCursor.lastSimilarity));
        if (afterCursor.lastId != null) params.set("afterId", String(afterCursor.lastId));
    }

    const res = await authFetch(`${baseUrl}/chart/recommended?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    return {
        data,
        nextCursor: json?.nextCursor ?? null,
        hasMore: Boolean(json?.hasMore),
        limit: json?.limit ?? data.length,
    };
};

export const fetchRandomCharts = async ({
    limit,
    lang,
    categories,
    afterCursor,
    signal,
    authFetch,
}: ApiRandomChartParams): Promise<ApiAllChartResponse & { nextCursor?: AfterCursorRandom | null }> => {
    if (!limit) throw new Error("Limit is required");

    const params = new URLSearchParams();
    if (limit != null) params.set("limit", String(limit));
    if (categories != null) params.set("categories", String(categories));
    if (lang?.trim()) params.set("lang", lang.trim());
    if (afterCursor) {
        if (afterCursor.seed != null) params.set("seed", String(afterCursor.seed));
        if (afterCursor.lastSortKey != null) params.set("lastSortKey", String(afterCursor.lastSortKey));
        if (afterCursor.lastId != null) params.set("afterId", String(afterCursor.lastId));
    }

    const res = await authFetch(`${baseUrl}/chart/random?${params.toString()}`, { signal });

    if (!res.ok) {
        let text: string | undefined;
        try { text = await res.text(); } catch { /* ignore */ }
        throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
    }

    const json = await res.json();
    const data = (json?.data ?? []).map((row: any) => ({
        ...row,
        id: Number(row.id),
    })) as CardProps[];

    return {
        data,
        nextCursor: json?.nextCursor ?? null,
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
    authFetch,
}: FetchChartParams): Promise<ApiResponse> => {
    const params = new URLSearchParams();
    params.append("Database", db);
    params.append("Geos", geos);
    params.append("Variables", variables);
    if (startPeriod != null) params.append("StartPeriod", startPeriod);
    if (endPeriod != null) params.append("EndPeriod", endPeriod);

    const response = await authFetch(`${baseUrl}/chart/getData?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
};

// ── Database GET requests ─────────────────────────────────────────────────────

export const fetchDbAvailabilities = async ({
    db,
    authFetch,
}: {
    db: string;
    authFetch: AuthFetch;
}): Promise<ApiDbResponse> => {
    const params = new URLSearchParams({ Name: db });
    const response = await authFetch(`${baseUrl}/db?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
};

export const fetchCategories = async (authFetch: AuthFetch): Promise<string[]> => {
    const response = await authFetch(`${baseUrl}/db/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
};

// ── Saved GET requests ────────────────────────────────────────────────────────

export const fetchSavedEvents = async (
    lang: string,
    authFetch: AuthFetch,
    { timeoutMs = 10000 } = {}
): Promise<SavedCardProps[]> => {
    const params = new URLSearchParams();
    if (lang?.trim()) params.set("lang", lang.trim());
    // userId no longer sent — backend reads it from the JWT

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await authFetch(`${baseUrl}/events/saved?${params.toString()}`, {
            method: "GET",
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const json: ApiSavedEventsResponse = await response.json();
        if (!json || !Array.isArray(json.data)) return [];

        return json.data.map(item => ({
            savedAt: item.savedAt ?? "",
            data: item.data ?? {},
        }));
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") throw new Error("Request timed out");
        throw err;
    }
};

export const fetchSavedIdsEvents = async (
    authFetch: AuthFetch,
    { timeoutMs = 10000 } = {}
): Promise<string[]> => {
    // userId no longer sent — backend reads it from the JWT
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await authFetch(`${baseUrl}/events/savedIds`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) return [];

        return json
            .map((v: any) => String(v).trim())
            .filter((s: string) => s.length > 0);
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") throw new Error("Request timed out");
        throw err;
    }
};

// ── Saved DELETE requests ─────────────────────────────────────────────────────

export const deleteSavedEvent = async ({
    objectId,
    authFetch,
}: {
    objectId: string;  // userId removed — backend reads it from the JWT
    authFetch: AuthFetch;
}): Promise<void> => {
    const params = new URLSearchParams({ objectId });
    const response = await authFetch(
        `${baseUrl}/events/saved/del?${params.toString()}`,
        { method: "DELETE" }
    );
    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Delete failed: ${response.status} ${txt}`);
    }
};

// ── Event POST requests ───────────────────────────────────────────────────────

export const postNewEvent = async ({
    action,
    objectId,
    authFetch,
}: {
    action: string;
    objectId: string;
    authFetch: AuthFetch;
}): Promise<void> => {
    const response = await authFetch(`${baseUrl}/events/new`, {
        method: "POST",
        body: JSON.stringify({ action, objectId }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
};

// ── Questions GET requests ────────────────────────────────────────────────────

export const fetchUserQuestions = async ({
    numQuestions = 1,
    authFetch,
}: {
    numQuestions: number;  // userId removed — backend reads it from the JWT
    authFetch: AuthFetch;
}) => {
    const params = new URLSearchParams({
        numQuestions: String(numQuestions),
    });

    const response = await authFetch(
        `${baseUrl}/questionnaire/dailyquestion?${params.toString()}`
    );
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
    }
    return response.json() as Promise<ApiUserQuestionsResponse>;
};

// ── UserQuestionStates POST requests ─────────────────────────────────────────

export const postUserQuestionState = async ({
    questionId,
    consecutiveCorrect,
    authFetch,
}: {
    questionId: number;        // userId removed — backend reads it from the JWT
    consecutiveCorrect: number;
    authFetch: AuthFetch;
}) => {
    const response = await authFetch(`${baseUrl}/questionnaire/userquestionstate`, {
        method: "POST",
        body: JSON.stringify({
            question_id: questionId,
            consecutive_correct: consecutiveCorrect,
            next_due_at: null,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
    }
    return response.json();
};

// ── Translations GET requests ─────────────────────────────────────────────────

export const fetchTranslations = async (lang: string, authFetch: AuthFetch) => {
    const response = await authFetch(`${baseUrl}/dictionaries/mobilePages?lang=${lang}`);
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    const data = await response.json();
    return data;
};

// ── Data Request POST requests ────────────────────────────────────────────────

export const postDataRequest = async (message: string, authFetch: AuthFetch): Promise<void> => {
    const response = await authFetch(`${baseUrl}/requests/new`, {
        method: "POST",
        body: JSON.stringify({ message }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
};