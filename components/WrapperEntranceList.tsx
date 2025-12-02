import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

// Chart list animation
const STAGGER_MS = 200;
const DURATION_MS = 800;
const INITIAL_TRANSLATEY = 20;

export default function AnimatedItemWrapper({
    children,
    index,
}: {
    children: React.ReactNode;
    index: number;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(INITIAL_TRANSLATEY);

    useEffect(() => {
        // use index (numeric) for stagger calculation — safe even if item.id is non-numeric
        const delay = index * STAGGER_MS;

        opacity.value = withDelay(
            delay,
            withTiming(1, {
                duration: DURATION_MS,
                easing: Easing.out(Easing.cubic),
            })
        );

        translateY.value = withDelay(
            delay,
            withTiming(0, {
                duration: DURATION_MS,
                easing: Easing.out(Easing.cubic),
            })
        );
        // no cleanup necessary
    }, [index, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}