const baseUrl = process.env.EXPO_PUBLIC_AZURE_URL?.replace(/\/$/, "");

export type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

// ── Chart GET requests ────────────────────────────────────────────────────────

//export const fetchAllChartDetails = async ({
//    query,
//    category,
//    lang,
//    limit,
//    afterCursor,
//    signal,
//    authFetch,
//}: {
//    query?: string;
//    category?: string;
//    lang?: string;
//    limit?: number;
//    afterCursor?: number | null;
//    signal?: AbortSignal;
//    authFetch: AuthFetch;
//}): Promise<ApiAllChartResponse> => {
//
//    const params = new URLSearchParams();
//    if (query?.trim()) params.set("search", query.trim());
//    if (category?.trim()) params.set("category", category.trim());
//    if (lang?.trim()) params.set("lang", lang.trim());
//    if (limit != null) params.set("limit", String(limit));
//    if (afterCursor != null) params.set("afterId", String(afterCursor));
//
//    const apiUrl = params.toString().length > 0
//        ? `${baseUrl}/chart/allCharts?${params.toString()}`
//        : `${baseUrl}/chart/allCharts`;
//
//    const response = await authFetch(apiUrl, { signal });
//    if (!response.ok) throw new Error(`HTTP ${response.status}`);
//
//    const json = await response.json();
//    const data = (json?.data ?? []).map((row: any) => ({
//        ...row,
//        id: Number(row.id),
//    })) as CardProps[];
//
//    //console.log(data)
//
//    return {
//        data,
//        nextCursor: json?.nextCursor == null ? null : Number(json.nextCursor),
//        hasMore: Boolean(json?.hasMore),
//        limit: json?.limit ?? data.length,
//    };
//};
//
//export const fetchRecommendedCharts = async ({
//    limit,
//    lang,
//    afterCursor,
//    excludeSeenDays,
//    signal,
//    authFetch,
//}: Omit<ApiRecommChartParams, 'userId'>): Promise<ApiAllChartResponse & { nextCursor?: AfterCursor | null }> => {
//    const params = new URLSearchParams();
//    // userId no longer sent — backend reads it from the JWT
//    if (limit != null) params.set("limit", String(limit));
//    if (lang?.trim()) params.set("lang", lang.trim());
//    if (excludeSeenDays != null) params.set("excludeSeenDays", String(excludeSeenDays));
//    if (afterCursor) {
//        if (afterCursor.lastSimilarity != null) params.set("lastSimilarity", String(afterCursor.lastSimilarity));
//        if (afterCursor.lastId != null) params.set("afterId", String(afterCursor.lastId));
//    }
//
//    const res = await authFetch(`${baseUrl}/chart/recommended?${params.toString()}`, { signal });
//    if (!res.ok) throw new Error(`HTTP ${res.status}`);
//    const json = await res.json();
//
//    const data = (json?.data ?? []).map((row: any) => ({
//        ...row,
//        id: Number(row.id),
//    })) as CardProps[];
//
//    return {
//        data,
//        nextCursor: json?.nextCursor ?? null,
//        hasMore: Boolean(json?.hasMore),
//        limit: json?.limit ?? data.length,
//    };
//};
//
//export const fetchRandomCharts = async ({
//    limit,
//    lang,
//    categories,
//    afterCursor,
//    signal,
//    authFetch,
//}: ApiRandomChartParams): Promise<ApiAllChartResponse & { nextCursor?: AfterCursorRandom | null }> => {
//    if (!limit) throw new Error("Limit is required");
//
//    const params = new URLSearchParams();
//    if (limit != null) params.set("limit", String(limit));
//    if (categories != null) params.set("categories", String(categories));
//    if (lang?.trim()) params.set("lang", lang.trim());
//    if (afterCursor) {
//        if (afterCursor.seed != null) params.set("seed", String(afterCursor.seed));
//        if (afterCursor.lastSortKey != null) params.set("lastSortKey", String(afterCursor.lastSortKey));
//        if (afterCursor.lastId != null) params.set("afterId", String(afterCursor.lastId));
//    }
//
//    const res = await authFetch(`${baseUrl}/chart/random?${params.toString()}`, { signal });
//
//    if (!res.ok) {
//        let text: string | undefined;
//        try { text = await res.text(); } catch { /* ignore */ }
//        throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
//    }
//
//    const json = await res.json();
//    const data = (json?.data ?? []).map((row: any) => ({
//        ...row,
//        id: Number(row.id),
//    })) as CardProps[];
//
//    return {
//        data,
//        nextCursor: json?.nextCursor ?? null,
//        hasMore: Boolean(json?.hasMore),
//        limit: json?.limit ?? data.length,
//    };
//};

// TEMP FETCHES 
const DUMMY_CHARTS: any = [
    { id: 1, chart_id: "1", title: "How free is the press, country by country?", description: "Compares scores across political, economic, social and legal freedoms.", db_name: "Reporters Without Borders", chart_type: "barHoriz", category: "press_media" },
    { id: 2, chart_id: "2", title: "Gross earnings for singles and couples", description: "Purchasing power adjusted, with and without children.", db_name: "Eurostat", chart_type: "line", category: "income_work" },
    { id: 3, chart_id: "3", title: "Gender violence, by victim nationality", description: "EU, non-EU and reporting-country breakdowns.", db_name: "Eurostat", chart_type: "hist", category: "gender_safety" },
    { id: 4, chart_id: "4", title: "CO2 emissions from transport over time", description: "Share of global emissions by transport mode, 1990–2023.", db_name: "Our World in Data", chart_type: "areaStacked", category: "climate_energy" },
    { id: 5, chart_id: "5", title: "Life expectancy vs healthcare spending", description: "Country-level comparison across 40 nations.", db_name: "World Bank", chart_type: "circles", category: "health" },
    { id: 6, chart_id: "6", title: "Migration flows into the EU, 2015–2024", description: "Net migration by origin region.", db_name: "Eurostat", chart_type: "sortedStream", category: "migration" },
    { id: 7, chart_id: "7", title: "Unemployment rate by education level", description: "Breakdown across OECD countries.", db_name: "OECD", chart_type: "barStacked", category: "income_work" },
    { id: 8, chart_id: "8", title: "Renewable energy share by country", description: "Percentage of total energy from renewables.", db_name: "Our World in Data", chart_type: "pie", category: "climate_energy" },
];

/** Simulates server-side pagination over the dummy dataset. */
function paginateDummy({
    query,
    category,
    limit = 5,
    afterCursor,
}: {
    query?: string;
    category?: string;
    limit?: number;
    afterCursor?: number | null;
}): ApiAllChartResponse {
    let filtered = DUMMY_CHARTS;

    if (query?.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter(
            (c: any) => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
        );
    }
    if (category?.trim()) {
        filtered = filtered.filter((c: any) => c.category === category.trim());
    }

    const startIndex = afterCursor != null ? filtered.findIndex((c: any) => Number(c.id) === afterCursor) + 1 : 0;
    const page = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;

    return {
        data: page,
        nextCursor: hasMore ? Number(page[page.length - 1]?.id) : null,
        hasMore,
        limit,
    };
}

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
    // TEMP: dummy data instead of real fetch
    return paginateDummy({ query, category, limit, afterCursor });
};

export const fetchRecommendedCharts = async ({
    limit,
    afterCursor,
}: Omit<ApiRecommChartParams, 'userId'>): Promise<ApiAllChartResponse & { nextCursor?: AfterCursor | null }> => {
    // TEMP: dummy data instead of real fetch
    const result = paginateDummy({ limit, afterCursor: afterCursor?.lastId ?? null });

    let nextCursor: AfterCursor | null = null;
    if (result.nextCursor != null) {
        nextCursor = Object.assign(result.nextCursor, {
            lastId: result.nextCursor,
            lastSimilarity: null,
        }) as unknown as AfterCursor;
    }

    return { ...result, nextCursor };
};

export const fetchRandomCharts = async ({
    limit,
    afterCursor,
}: ApiRandomChartParams): Promise<ApiAllChartResponse & { nextCursor?: AfterCursorRandom | null }> => {
    if (!limit) throw new Error("Limit is required");
    // TEMP: dummy data, shuffled, instead of real fetch
    const shuffled = [...DUMMY_CHARTS].sort(() => Math.random() - 0.5);
    const startIndex = afterCursor?.lastId != null
        ? shuffled.findIndex((c) => Number(c.id) === afterCursor.lastId) + 1
        : 0;
    const page = shuffled.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < shuffled.length;

    return {
        data: page,
        nextCursor: hasMore ? { lastId: Number(page[page.length - 1]?.id), lastSortKey: null, seed: null } : null,
        hasMore,
        limit,
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

export const fetchTranslations = async (lang: string) => {
    const response = await fetch(`${baseUrl}/dictionaries/mobilePages?lang=${lang}`);
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