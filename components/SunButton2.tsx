import { THEME_COLORS } from "@/constants/utilities";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";

export default function SunButton({
    label,
    icon,
    onPress,
    filled = true,
    disabled = false,
    className,
}: {
    label: string;
    icon?: React.ReactNode;
    onPress?: () => void;
    filled?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    const scale = useSharedValue(1);
    const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <View
            className={`${disabled ? "opacity-40" : "opacity-100"} ${className || ""}`}
            pointerEvents={disabled ? "none" : "auto"}
        >
            <View className="relative">
                <View
                    className="absolute rounded-full top-[5px] left-[5px] right-[-5px] bottom-[-5px]"
                    style={{ backgroundColor: filled ? THEME_COLORS.primary : "transparent" }}
                />
                <Animated.View style={aStyle}>
                    <Pressable
                        disabled={disabled}
                        onPressIn={() => (scale.value = withTiming(0.96, { duration: 100 }))}
                        onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
                        onPress={onPress}
                        className={`flex-row items-center justify-center rounded-full py-3.5 px-5 gap-2 ${filled ? "border-0" : "border-[1.5px] border-[rgba(52,58,64,0.25)]"}`}
                        style={{ backgroundColor: filled ? THEME_COLORS.dark : "transparent" }}
                    >
                        <Text className="font-sf-bold text-sm" style={{ color: filled ? THEME_COLORS.background : THEME_COLORS.dark }}>
                            {label}
                        </Text>
                        {icon}
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}