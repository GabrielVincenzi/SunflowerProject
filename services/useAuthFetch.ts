// services/authFetch.ts
import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

// Returns a fetch-compatible function that always injects the Bearer token.
// Use this instead of fetch() in all API calls.
export const useAuthFetch = () => {
    const { getToken } = useAuth();

    return useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        const token = await getToken();

        if (!token) throw new Error("Not authenticated");

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
    }, [getToken]);
};