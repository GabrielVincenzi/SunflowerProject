import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

export default function PeerOptionCard({
    label,
    active,
    isCohort,
    pct,
    barPct,
    onPress,
    delay = 0,
    entranceActive,
}: {
    label: string;
    active: boolean;
    isCohort: boolean;
    pct: number;
    barPct: number;
    onPress: () => void;
    delay?: number;
    entranceActive: boolean;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(16);
    const played = useRef(false);

    const clippedBarPct = Math.min(barPct, 100);

    useEffect(() => {
        if (entranceActive && !played.current) {
            played.current = true;
            opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
            translateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
        }
    }, [entranceActive]);

    const aStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    // the peer bar IS the shadow — same [5,5] offset as OptionCard,
    // but its width is the data instead of a full-size copy
    const shadowColor = active
        ? THEME_COLORS.primary
        : isCohort
            ? THEME_COLORS.secondary
            : "rgba(52,58,64,0.16)";

    return (
        <Animated.View style={aStyle}>
            <View
                className={`absolute rounded-full top-[50px] left-[20px] bottom-[-3px] ${active ? "z-10" : ""}`}
                style={{ width: `${clippedBarPct}%`, backgroundColor: shadowColor }}
            />

            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.85}
                className="flex-row items-center rounded-full py-3.5 px-3.5 gap-3 border-[1.5px]"
                style={{
                    borderColor: active ? THEME_COLORS.dark : "rgba(52,58,64,0.14)",
                    backgroundColor: active ? "transparent" : THEME_COLORS.background,
                }}
            >
                <View className="flex-1">
                    <Text className="font-sf-bold text-md text-dark">
                        {label}
                    </Text>
                </View>

                <View
                    className="items-center justify-center w-[30px] h-[30px] border-[1.5px] rounded-full"
                    style={{
                        borderColor: active
                            ? THEME_COLORS.dark
                            : isCohort
                                ? "rgba(252,211,77,0.55)"
                                : "rgba(52,58,64,0.2)",
                        backgroundColor: active
                            ? THEME_COLORS.dark
                            : isCohort
                                ? "rgba(252,211,77,0.16)"
                                : "rgba(52,58,64,0.05)",
                    }}
                >
                    {active ? (
                        <Feather name="check" size={14} color={THEME_COLORS.background} />
                    ) : (
                        <Text
                            className="text-sm font-sf-bold"
                            style={{ color: isCohort ? THEME_COLORS.dark : "rgba(52,58,64,0.4)" }}
                        >
                            {pct}%
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}