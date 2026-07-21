import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";

export default function OptionCard({
    label,
    description,
    icon,
    selected,
    onPress,
    delay = 0,
    active,
}: {
    label: string;
    description?: string;
    icon?: string;
    selected: boolean;
    onPress: () => void;
    radio?: boolean;
    delay?: number;
    active: boolean;
    filled?: boolean;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(16);
    const played = useRef(false);
    useEffect(() => {
        if (active && !played.current) {
            played.current = true;
            opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
            translateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
        }
    }, [active]);
    const aStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={aStyle}>
            <View
                className="absolute rounded-full top-[5px] left-[5px] right-[-5px] bottom-[-5px]"
                style={{ backgroundColor: selected ? THEME_COLORS.primary : "transparent" }}
            />
            <Pressable
                onPress={onPress}
                className="flex-row items-center rounded-full py-3.5 px-3.5 gap-3 border-[1.5px]"
                style={{
                    borderColor: selected ? THEME_COLORS.dark : "rgba(52,58,64,0.14)",
                    backgroundColor: selected ? "rgba(252,211,77,0.18)" : THEME_COLORS.background,
                }}
            >
                {icon && <Feather name={icon as any} size={16} color={THEME_COLORS.grey} />}
                <View className="flex-1">
                    <Text className="font-sf-bold text-[13.5px]" style={{ color: THEME_COLORS.dark }}>{label}</Text>
                    {description && (
                        <Text className="font-sf-regular text-[11.5px] mt-0.5" style={{ color: "rgba(52,58,64,0.55)" }}>
                            {description}
                        </Text>
                    )}
                </View>
                <View
                    className="items-center justify-center w-[19px] h-[19px] border-[1.5px] rounded-full"
                    style={{
                        borderColor: selected ? THEME_COLORS.dark : "rgba(52,58,64,0.25)",
                        backgroundColor: selected ? THEME_COLORS.dark : "transparent",
                    }}
                >
                    {selected && (
                        <View
                            className="w-[7px] h-[7px] rounded-full"
                            style={{ backgroundColor: THEME_COLORS.background }}
                        />
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}