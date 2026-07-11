import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, FeGaussianBlur, Filter, Path, Pattern, Rect } from "react-native-svg";

// ─── Palette (mirrors THEME_COLORS) ────────────────────────────────────────────
const C = {
    primary: "#FCD34D",
    secondary: "#D99201",
    dark: "#343a40",
    marked: "#84CC16",
};

const TEARDROP_D = "M0,-19 C9,-9 9,9 0,20 C-9,9 -9,-9 0,-19 Z";
const CRESCENT_D = "M-3,-19 Q11,0 -3,19 Q-8,0 -3,-19 Z";

// ─── Wall texture — the same 96x96 tile as the web version, as a real SVG <Pattern>
function WallPattern({ id }: { id: string }) {
    return (
        <Defs>
            <Pattern id={id} width={96} height={96} patternUnits="userSpaceOnUse">
                <Rect width={96} height={96} fill={C.primary} />
                <Ellipse cx={16} cy={14} rx={7} ry={16} fill={C.secondary} opacity={0.5} transform="rotate(18 16 14)" />
                <Path d={TEARDROP_D} fill={C.dark} opacity={0.1} transform="translate(70,10) rotate(-30) scale(0.5)" />
                <Ellipse cx={46} cy={58} rx={8} ry={18} fill={C.secondary} opacity={0.4} transform="rotate(64 46 58)" />
                <Path d={CRESCENT_D} fill={C.marked} opacity={0.15} transform="translate(86,72) rotate(105) scale(0.55)" />
                <Ellipse cx={8} cy={84} rx={6} ry={14} fill={C.secondary} opacity={0.45} transform="rotate(-42 8 84)" />
            </Pattern>
        </Defs>
    );
}

// ─── One falling petal shape (oval / teardrop / crescent) ─────────────────────
type ShapeType = "oval" | "teardrop" | "crescent";

function PetalShape({ type, color, opacity }: { type: ShapeType; color: string; opacity: number }) {
    return (
        <Svg width="100%" height="100%" viewBox="-20 -22 40 44">
            {type === "teardrop" && <Path d={TEARDROP_D} fill={color} opacity={opacity} />}
            {type === "crescent" && <Path d={CRESCENT_D} fill={color} opacity={opacity} />}
            {type === "oval" && <Ellipse cx={0} cy={0} rx={12} ry={19} fill={color} opacity={opacity} />}
        </Svg>
    );
}

type Petal = {
    id: number;
    left: number; // percent
    size: number;
    sway: number; // px, drift amplitude
    rot: number; // deg, total spin
    shape: ShapeType;
    color: string;
    opacity: number;
    blur: number;
    duration: number;
    delay: number;
    depth: "far" | "mid" | "near";
};

// ─── One falling petal — drifting S-curve fall, matching the CSS @keyframes
// petalFall stops exactly: 0% / 12% / 32% / 58% / 82% / 100%.
function FallingPetalView({ petal, containerHeight, play, useBlur }: { petal: Petal; containerHeight: number; play: boolean; useBlur: boolean }) {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        if (!play) {
            progress.value = 0;
            return;
        }
        progress.value = withTiming(0, { duration: 0 }); // reset instantly
        progress.value = withTiming(1, { duration: petal.duration, easing: Easing.linear });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [play]);

    const style = useAnimatedStyle(() => {
        const stops = [0, 0.12, 0.32, 0.58, 0.82, 1];
        const tx = interpolate(progress.value, stops, [0, 0, petal.sway * 0.5, petal.sway * -0.35, petal.sway * 0.4, 0], Extrapolation.CLAMP);
        const ty = interpolate(
            progress.value,
            stops,
            [-10, -10, containerHeight * 0.3194, containerHeight * 0.5833, containerHeight * 0.8472, containerHeight * 1.0556],
            Extrapolation.CLAMP
        );
        const rot = interpolate(progress.value, stops, [0, 0, petal.rot * 0.3, petal.rot * 0.62, petal.rot * 0.88, petal.rot], Extrapolation.CLAMP);
        const scale = interpolate(progress.value, stops, [0.85, 0.85, 1.05, 0.92, 1.02, 0.88], Extrapolation.CLAMP);
        const opacity = interpolate(progress.value, stops, [0, 1, 1, 1, 1, 0], Extrapolation.CLAMP);

        return {
            opacity,
            transform: [{ translateX: tx }, { translateY: ty }, { rotate: `${rot}deg` }, { scale }],
        };
    });

    const filterId = `blur-${petal.id}`;

    return (
        <Animated.View
            style={[
                { position: "absolute", left: `${petal.left}%`, top: 0, width: petal.size, height: petal.size * 1.15 },
                style,
            ]}
        >
            {useBlur && petal.blur > 0 ? (
                <Svg width="100%" height="100%" viewBox="-20 -22 40 44">
                    <Defs>
                        <Filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                            <FeGaussianBlur stdDeviation={petal.blur} />
                        </Filter>
                    </Defs>
                    {petal.shape === "teardrop" && <Path d={TEARDROP_D} fill={petal.color} opacity={petal.opacity} filter={`url(#${filterId})`} />}
                    {petal.shape === "crescent" && <Path d={CRESCENT_D} fill={petal.color} opacity={petal.opacity} filter={`url(#${filterId})`} />}
                    {petal.shape === "oval" && <Ellipse cx={0} cy={0} rx={12} ry={19} fill={petal.color} opacity={petal.opacity} filter={`url(#${filterId})`} />}
                </Svg>
            ) : (
                <PetalShape type={petal.shape} color={petal.color} opacity={petal.opacity} />
            )}
        </Animated.View>
    );
}

// ─── Phase machine — identical timings/easings to the web version ─────────────
type Phase = "idle" | "growing" | "holding" | "dropping";

export type PetalWallTransitionRef = { play: () => void };

type Props = {
    /** Fires the instant the screen is fully covered — do your navigation here. */
    onCovered?: () => void;
    /** Fires once the overlay has fully cleared away. */
    onFinished?: () => void;
    /** Disable per-petal blur if it misbehaves on a given Android device. */
    useBlur?: boolean;
};

const PetalWallTransition = forwardRef<PetalWallTransitionRef, Props>(({ onCovered, onFinished, useBlur = true }, ref) => {
    const { width, height } = useWindowDimensions();
    const [phase, setPhase] = useState<Phase>("idle");
    const [runId, setRunId] = useState(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const moundHeight = useSharedValue(0);
    const moundTranslateY = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        play: () => {
            setRunId((r) => r + 1);
            setPhase("growing");
        },
    }));

    // Drive the shared values whenever phase changes — plain JS-thread effect,
    // no runOnJS needed anywhere in either direction.
    React.useEffect(() => {
        if (phase === "growing") {
            moundTranslateY.value = 0;
            moundHeight.value = withTiming(height * 1.38, { duration: 950, easing: Easing.bezier(0.16, 1, 0.3, 1) });
        } else if (phase === "dropping") {
            moundTranslateY.value = withTiming(height * 1.15, { duration: 700, easing: Easing.bezier(0.6, 0, 0.85, 0.2) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, height]);

    React.useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (phase === "growing") {
            timer.current = setTimeout(() => setPhase("holding"), 950);
        } else if (phase === "holding") {
            timer.current = setTimeout(() => {
                onCovered?.();
                setPhase("dropping");
            }, 220);
        } else if (phase === "dropping") {
            timer.current = setTimeout(() => {
                setPhase("idle");
                moundHeight.value = 0;
                onFinished?.();
            }, 700);
        }
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const petals = useMemo<Petal[]>(() => {
        if (phase === "idle" && runId === 0) return [];
        const shapes: ShapeType[] = ["oval", "teardrop", "crescent"];
        const palette = [C.secondary, C.dark, C.secondary, C.primary];
        return Array.from({ length: 42 }).map((_, i) => {
            const r = Math.random();
            const depth: Petal["depth"] = r < 0.3 ? "far" : r < 0.65 ? "mid" : "near";
            const size = depth === "far" ? 7 + Math.random() * 4 : depth === "mid" ? 12 + Math.random() * 6 : 18 + Math.random() * 8;
            const opacity = depth === "far" ? 0.35 + Math.random() * 0.2 : depth === "mid" ? 0.6 + Math.random() * 0.2 : 0.8 + Math.random() * 0.15;
            const blur = depth === "far" ? 1.4 : depth === "mid" ? 0.4 : 0;
            const duration = depth === "far" ? 1500 + Math.random() * 600 : depth === "mid" ? 1100 + Math.random() * 500 : 850 + Math.random() * 400;
            const color = Math.random() < 0.08 ? C.marked : palette[i % palette.length];
            return {
                id: i,
                left: 2 + Math.random() * 96,
                size,
                sway: (Math.random() - 0.5) * 90,
                rot: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 260),
                shape: shapes[i % shapes.length],
                color,
                opacity,
                blur,
                duration,
                delay: Math.random() * 500,
                depth,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);

    const behindPetals = petals.filter((p) => p.depth === "far");
    const frontPetals = petals.filter((p) => p.depth !== "far");

    const moundStyle = useAnimatedStyle(() => ({
        height: moundHeight.value,
        transform: [{ translateY: moundTranslateY.value }],
    }));

    if (phase === "idle") return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {behindPetals.map((p) => (
                <FallingPetalView key={p.id} petal={p} containerHeight={height} play useBlur={useBlur} />
            ))}

            <Animated.View style={[{ position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" }, moundStyle]}>
                <Svg width={width} height={height * 1.38}>
                    <WallPattern id="petalWallPattern" />
                    <Rect width={width} height={height * 1.38} fill="url(#petalWallPattern)" />
                </Svg>
            </Animated.View>

            {frontPetals.map((p) => (
                <FallingPetalView key={p.id} petal={p} containerHeight={height} play useBlur={useBlur} />
            ))}
        </View>
    );
});

export default PetalWallTransition;