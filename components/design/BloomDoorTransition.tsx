import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, Line, Path, Pattern, Rect } from "react-native-svg";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
    primary: "#FCD34D",
    secondary: "#D99201",
    dark: "#343a40",
    marked: "#84CC16",
};

const TEARDROP_D = "M0,-19 C9,-9 9,9 0,20 C-9,9 -9,-9 0,-19 Z";
const CRESCENT_D = "M-3,-19 Q11,0 -3,19 Q-8,0 -3,-19 Z";
const PETAL_COUNT = 10;

// getTotalLength() doesn't exist in react-native-svg — every shape here is a
// circle or an ellipse, so the circumference is computed analytically instead
// (Ramanujan's approximation; reduces to 2πr exactly when a === b).
function ellipseCircumference(a: number, b: number) {
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}
const CORE_LEN = ellipseCircumference(15, 15); // ≈ 94.25
const OUTER_PETAL_LEN = ellipseCircumference(10, 24); // ≈ 111.39
const INNER_PETAL_LEN = ellipseCircumference(6, 15); // ≈ 69.04
const OUTER_CIRCLE_LEN = ellipseCircumference(48, 48); // ≈ 301.59

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedLine = Animated.createAnimatedComponent(Line);

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

type Phase = "idle" | "closing" | "lineIn" | "drawing" | "filling" | "lineOut" | "revealing";

const BLOOM_SMALL_SIZE = 168;

// ─── One drawn shape: stroke draws in via strokeDashoffset, then fills via
// fillOpacity (not by interpolating the `fill` attribute itself — 'none' isn't
// a real color to interpolate toward, so fillOpacity 0→1 against a constant
// white fill gives the identical visual result).
function useDrawnShapeProps(length: number, phase: Phase, delay: number, duration: number) {
    const dashOffset = useSharedValue(length);
    const fillOpacity = useSharedValue(0);

    React.useEffect(() => {
        if (phase === "drawing") {
            dashOffset.value = length;
            dashOffset.value = withTiming(0, { duration, easing: Easing.bezier(0.65, 0, 0.35, 1) }, undefined);
            // withDelay wraps the whole thing so the stagger matches the original
        }
        if (phase === "filling" || phase === "lineOut" || phase === "revealing") {
            fillOpacity.value = withTiming(1, { duration: 560, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        }
        if (phase === "idle") {
            dashOffset.value = length;
            fillOpacity.value = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // delay is applied via a one-off timeout that kicks the timing off, since
    // Reanimated's withDelay would also work — either is JS-thread-triggered,
    // no runOnJS involved either way.
    React.useEffect(() => {
        if (phase !== "drawing") return;
        const t = setTimeout(() => {
            dashOffset.value = withTiming(0, { duration, easing: Easing.bezier(0.65, 0, 0.35, 1) });
        }, delay);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    return useAnimatedProps(() => ({
        strokeDashoffset: dashOffset.value,
        fillOpacity: fillOpacity.value,
    }));
}

function BloomFlower({ phase }: { phase: Phase }) {
    const coreProps = useDrawnShapeProps(CORE_LEN, phase, 0, 560);
    const outerProps = Array.from({ length: PETAL_COUNT }).map((_, i) => useDrawnShapeProps(OUTER_PETAL_LEN, phase, 480 + i * 56, 448));
    const innerProps = Array.from({ length: PETAL_COUNT }).map((_, i) => useDrawnShapeProps(INNER_PETAL_LEN, phase, 896 + i * 48, 416));
    const outerCircleProps = useDrawnShapeProps(OUTER_CIRCLE_LEN, phase, 1680, 688);

    return (
        <Svg viewBox="-60 -60 120 120" width="100%" height="100%">
            {/* rotate(90) shifts each shape's stroke-draw start point from its
                default (rightmost, 3 o'clock) to the bottom — where the
                incoming line stops — same trick as the web version. */}
            <AnimatedCircle
                r={15}
                stroke="#fff"
                strokeWidth={1.4}
                fill="#fff"
                strokeDasharray={`${CORE_LEN}`}
                transform="rotate(90)"
                animatedProps={coreProps}
            />
            {Array.from({ length: PETAL_COUNT }).map((_, i) => (
                <AnimatedEllipse
                    key={`o${i}`}
                    cx={0}
                    cy={-32}
                    rx={10}
                    ry={24}
                    stroke="#fff"
                    strokeWidth={1.4}
                    fill="#fff"
                    strokeDasharray={`${OUTER_PETAL_LEN}`}
                    transform={`rotate(${i * (360 / PETAL_COUNT)})`}
                    animatedProps={outerProps[i]}
                />
            ))}
            {Array.from({ length: PETAL_COUNT }).map((_, i) => (
                <AnimatedEllipse
                    key={`i${i}`}
                    cx={0}
                    cy={-22}
                    rx={6}
                    ry={15}
                    stroke="#fff"
                    strokeWidth={1.2}
                    fill="#fff"
                    strokeDasharray={`${INNER_PETAL_LEN}`}
                    transform={`rotate(${i * (360 / PETAL_COUNT) + 18})`}
                    animatedProps={innerProps[i]}
                />
            ))}
            <AnimatedCircle
                r={48}
                stroke="#fff"
                strokeWidth={1.6}
                fill="#fff"
                strokeDasharray={`${OUTER_CIRCLE_LEN}`}
                transform="rotate(90)"
                animatedProps={outerCircleProps}
            />
        </Svg>
    );
}

// ─── Traveling line: bottom → center (lineIn), pause while the flower draws,
// then center → top (lineOut) — one continuous stroke, revealed in two beats.
function CenterLine({ phase, width, height }: { phase: Phase; width: number; height: number }) {
    const dashOffset = useSharedValue(height);
    const length = height;

    React.useEffect(() => {
        if (phase === "lineIn") {
            dashOffset.value = length;
            dashOffset.value = withTiming(length / 2, { duration: 720, easing: Easing.bezier(0.45, 0, 0.55, 1) });
        }
        if (phase === "lineOut") {
            dashOffset.value = withTiming(0, { duration: 720, easing: Easing.bezier(0.45, 0, 0.55, 1) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dashOffset.value }));

    return (
        <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
            <AnimatedLine
                x1={width / 2}
                y1={height}
                x2={width / 2}
                y2={0}
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={`${length}`}
                animatedProps={animatedProps}
            />
        </Svg>
    );
}

export type BloomTransitionRef = { play: () => void };

type Props = {
    /** Fires the instant the flower opens and the screen underneath is shown — do your navigation here. */
    onCovered?: () => void;
    /** Fires once the overlay has fully cleared away. */
    onFinished?: () => void;
};

const BloomDoorTransition = forwardRef<BloomTransitionRef, Props>(({ onCovered, onFinished }, ref) => {
    const { width, height } = useWindowDimensions();
    const [phase, setPhase] = useState<Phase>("idle");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const leftPanel = useSharedValue(-1); // -1 = fully off left, 0 = closed
    const rightPanel = useSharedValue(1); // 1 = fully off right, 0 = closed
    const doorOpacity = useSharedValue(1);
    const flowerSize = useSharedValue(BLOOM_SMALL_SIZE);
    const flowerOpacity = useSharedValue(1);

    const bigSize = Math.max(width, height) * 1.8;

    useImperativeHandle(ref, () => ({
        play: () => setPhase("closing"),
    }));

    React.useEffect(() => {
        if (phase === "closing") {
            leftPanel.value = -1;
            rightPanel.value = 1;
            doorOpacity.value = 1;
            flowerSize.value = BLOOM_SMALL_SIZE;
            flowerOpacity.value = 1;
            leftPanel.value = withTiming(0, { duration: 1120, easing: Easing.bezier(0.65, 0, 0.35, 1) });
            rightPanel.value = withTiming(0, { duration: 1120, easing: Easing.bezier(0.65, 0, 0.35, 1) });
        } else if (phase === "revealing") {
            leftPanel.value = withTiming(-1, { duration: 1250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
            rightPanel.value = withTiming(1, { duration: 1250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
            doorOpacity.value = withTiming(0.85, { duration: 1250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
            flowerSize.value = withTiming(bigSize, { duration: 1250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
            flowerOpacity.value = withTiming(0, { duration: 1250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, width, height]);

    React.useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (phase === "closing") {
            timer.current = setTimeout(() => setPhase("lineIn"), 1120);
        } else if (phase === "lineIn") {
            timer.current = setTimeout(() => setPhase("drawing"), 720);
        } else if (phase === "drawing") {
            timer.current = setTimeout(() => setPhase("filling"), 2400);
        } else if (phase === "filling") {
            timer.current = setTimeout(() => setPhase("lineOut"), 560);
        } else if (phase === "lineOut") {
            timer.current = setTimeout(() => {
                onCovered?.();
                setPhase("revealing");
            }, 720);
        } else if (phase === "revealing") {
            timer.current = setTimeout(() => {
                setPhase("idle");
                onFinished?.();
            }, 1250);
        }
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const leftStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftPanel.value * width }],
        opacity: doorOpacity.value,
    }));
    const rightStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightPanel.value * width }],
        opacity: doorOpacity.value,
    }));
    const flowerContainerStyle = useAnimatedStyle(() => ({
        width: flowerSize.value,
        height: flowerSize.value,
        marginLeft: -flowerSize.value / 2,
        marginTop: -flowerSize.value / 2,
        opacity: flowerOpacity.value,
    }));

    if (phase === "idle") return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%" }, leftStyle]}>
                <Svg width="100%" height="100%">
                    <WallPattern id="bloomWallPatternLeft" />
                    <Rect width="100%" height="100%" fill="url(#bloomWallPatternLeft)" />
                </Svg>
            </Animated.View>
            <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "50%" }, rightStyle]}>
                <Svg width="100%" height="100%">
                    <WallPattern id="bloomWallPatternRight" />
                    <Rect width="100%" height="100%" fill="url(#bloomWallPatternRight)" />
                </Svg>
            </Animated.View>

            {phase !== "closing" && <CenterLine phase={phase} width={width} height={height} />}

            {(phase === "drawing" || phase === "filling" || phase === "lineOut" || phase === "revealing") && (
                <Animated.View style={[{ position: "absolute", left: "50%", top: "50%" }, flowerContainerStyle]}>
                    <BloomFlower phase={phase} />
                </Animated.View>
            )}
        </View>
    );
});

export default BloomDoorTransition;