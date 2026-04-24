import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { AppStateStatus } from "react-native";
import { AppState } from "react-native";
import { postNewEvent } from "./api";
import { useAppState } from "./useAppState";
import { useAuthFetch } from "./useAuthFetch";

type Params = {
    userId?: string | null;
    objectId?: string | null;
    delayMs?: number; // default 20_000
    enabled?: boolean;
};

export default function useSeen({
    userId,
    objectId,
    delayMs = 20_000,
    enabled = true,
}: Params) {
    const queryClient = useQueryClient();
    const authFetch = useAuthFetch();

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sentRef = useRef(false); // prevents duplicate sends per mounted instance

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const seenMutation = useMutation({
        mutationFn: ({ objectId, authFetch }: { objectId: string; authFetch: AuthFetch }) =>
            postNewEvent({ action: "seen", objectId, authFetch }),
        onError: (err) => {
            // optional: keep sentRef false so we can retry on next mount/active
            console.warn("postNewEvent(seen) failed:", err);
            sentRef.current = false;
        },
        onSettled: () => { }
    });

    const schedule = useCallback(() => {
        clearTimer();

        if (!enabled) return;
        if (!objectId) return;
        if (sentRef.current) return;

        timerRef.current = setTimeout(() => {
            // final guard
            if (!objectId) return;
            seenMutation.mutate({ objectId, authFetch });
            sentRef.current = true;
            timerRef.current = null;
        }, delayMs);
    }, [clearTimer, delayMs, enabled, objectId, seenMutation]);

    // AppState change handler: start timer when active; clear timer when not active.
    const onAppStateChange = useCallback(
        (status: AppStateStatus) => {
            if (!enabled) return;
            if (sentRef.current) return;

            if (status === "active") {
                // start fresh countdown whenever we become active
                // (this also covers returning to the screen)
                schedule();
            } else {
                // background/inactive/unfocused => cancel and reset countdown
                clearTimer();
            }
        },
        [clearTimer, enabled, schedule]
    );

    // initialize on mount / when deps change:
    useEffect(() => {
        // reset on user/object change so new page can send again
        clearTimer();
        sentRef.current = false;

        // if app is active right now, start timer immediately
        try {
            if (AppState.currentState === "active") {
                schedule();
            }
        } catch (e) {
            // fallback: schedule anyway
            schedule();
        }

        return () => {
            clearTimer();
        };
    }, [userId, objectId, delayMs, enabled, schedule, clearTimer]);

    // wire up app state listener using your hook
    useAppState(onAppStateChange);

    const hasSent = useCallback(() => sentRef.current, []);

    return { hasSent, isScheduled: () => !!timerRef.current };
}
