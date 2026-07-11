import { THEME_COLORS } from "@/constants/utilities";
import React, { useEffect } from "react";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, G } from "react-native-svg";

/* ------------------------------------------------------------------ */
/* Static outline sunflower (hero) + static badge flower (reveal)       */
/* ------------------------------------------------------------------ */
const AnimatedG = Animated.createAnimatedComponent(G);

export default function OutlineFlower({ size = 140 }: { size?: number }) {
    const petals = Array.from({ length: 12 });
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 10, easing: Easing.linear }),
            -1, // infinite
            false // don't reverse, always spin same direction
        );
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        rotation: rotation.value,
        origin: [0, 0], // pivot around SVG center
    }));

    return (
        <Svg width={size} height={size} viewBox="-60 -60 120 120">
            <AnimatedG animatedProps={animatedProps}>
                {petals.map((_, i) => (
                    <Ellipse
                        key={i}
                        cx={0}
                        cy={-38}
                        rx={9}
                        ry={20}
                        fill="none"
                        stroke={THEME_COLORS.secondary}
                        strokeWidth={1.4}
                        opacity={0.85}
                        transform={`rotate(${i * (360 / petals.length)})`}
                    />
                ))}
            </AnimatedG>

            {/* Center stays static, outside the rotating group */}
            <Circle r={19} fill="none" stroke={THEME_COLORS.dark} strokeWidth={1.4} />
            <Circle r={19} fill={THEME_COLORS.primary} opacity={0.18} />
        </Svg>
    );
}