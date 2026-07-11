import React, { useEffect, useRef } from "react";
import { TextStyle, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";

function Word({
    text,
    active,
    delay,
    className,
    style,
}: {
    text: string;
    active: boolean;
    delay: number;
    className?: string;
    style?: TextStyle;
}) {
    const translateY = useSharedValue(20);
    const opacity = useSharedValue(0);
    const prevActive = useRef(false);

    useEffect(() => {
        if (active) {
            translateY.value = 20;
            opacity.value = 0;
            translateY.value = withDelay(delay, withTiming(0, { duration: 850, easing: Easing.out(Easing.cubic) }));
            opacity.value = withDelay(delay, withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
        } else if (prevActive.current) {
            translateY.value = withDelay(delay, withTiming(-16, { duration: 300, easing: Easing.in(Easing.cubic) }));
            opacity.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }));
        }
        prevActive.current = active;
    }, [active]);

    const aStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View className="overflow-hidden">
            <Animated.Text className={className} style={[style, aStyle]}>{text}</Animated.Text>
        </View>
    );
}

export default function AnimatedWords({
    text,
    active,
    baseDelay = 0,
    stagger = 40,
    className,
    style,
}: {
    text: string;
    active: boolean;
    baseDelay?: number;
    stagger?: number;
    className?: string;
    style?: TextStyle;
}) {
    const words = text.split(" ");
    return (
        <View className="flex-row flex-wrap">
            {words.map((w, i) => (
                <Word
                    key={i}
                    text={w + (i < words.length - 1 ? " " : "")}
                    active={active}
                    delay={baseDelay + i * stagger}
                    className={className}
                    style={style}
                />
            ))}
        </View>
    );
}