// context/ScreenTransitionContext.tsx
import { useRouter } from "expo-router";
import React, { createContext, useContext, useRef } from "react";
import BloomDoorTransition, { BloomTransitionRef } from "../design/BloomDoorTransition";
import PetalWallTransition, { PetalWallTransitionRef } from "../design/PetalWallTransition";

type Kind = "petal" | "bloom";
type ContextValue = { runTransition: (kind: Kind, destination: string) => void };

const ScreenTransitionContext = createContext<ContextValue | null>(null);

export function ScreenTransitionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const petalRef = useRef<PetalWallTransitionRef>(null);
    const bloomRef = useRef<BloomTransitionRef>(null);
    const destination = useRef<string | null>(null);

    const runTransition = (kind: Kind, dest: string) => {
        destination.current = dest;
        (kind === "petal" ? petalRef : bloomRef).current?.play();
    };

    const handleCovered = () => {
        if (destination.current) {
            router.replace(destination.current as any);
            destination.current = null;
        }
    };

    return (
        <ScreenTransitionContext.Provider value={{ runTransition }}>
            {children}
            {/* rendered LAST so they paint on top of whatever screen is active */}
            <PetalWallTransition ref={petalRef} onCovered={handleCovered} />
            <BloomDoorTransition ref={bloomRef} onCovered={handleCovered} />
        </ScreenTransitionContext.Provider>
    );
}

export function useScreenTransition() {
    const ctx = useContext(ScreenTransitionContext);
    if (!ctx) throw new Error("useScreenTransition must be used within ScreenTransitionProvider");
    return ctx;
}