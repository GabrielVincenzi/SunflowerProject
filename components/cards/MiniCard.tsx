import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";

const CARD_GAP = 14;
const CARDS_VISIBLE = 1.6; // how many cards peek on screen at once
const CARD_WIDTH =
    (Dimensions.get("window").width - 24 * 2 - CARD_GAP * (CARDS_VISIBLE - 1)) / CARDS_VISIBLE;

interface TodayCardProps {
    iconGlyph: keyof typeof Feather.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    isDark?: boolean;
}

// Compact, fixed-width sibling of MiniCard — same shadow-offset /
// rounded-corner / icon-circle language, but sized for a horizontal
// scroll row instead of a square grid tile. isDark is reused the
// same way MiniCard uses it: the one item that should read as the
// "main" pick in the row (here, the search hint) goes dark.
export default function MiniCard({
    iconGlyph,
    title,
    subtitle,
    onPress,
    isDark = false,
}: TodayCardProps) {
    const bgColor = isDark ? THEME_COLORS.dark : THEME_COLORS.background;
    const titleColor = isDark ? THEME_COLORS.background : THEME_COLORS.dark;
    const subtitleColor = isDark ? `${THEME_COLORS.background}40` : `${THEME_COLORS.dark}40`;

    return (
        <View className="relative h-[124px]" style={{ width: CARD_WIDTH }}>
            {/* Shadow layer */}
            <View
                className="absolute inset-0 bg-dark rounded-[28px]"
                style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />

            {/* Content layer */}
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                className="flex-1 rounded-[28px] p-4 justify-between overflow-hidden border-[1.5px]"
                style={{ backgroundColor: bgColor, borderColor: THEME_COLORS.dark }}
            >
                <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                >
                    <Feather name={iconGlyph} size={15} color={THEME_COLORS.dark} />
                </View>

                <View>
                    <Text className="text-cardtitle" style={{ color: titleColor }}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-motto" style={{ color: subtitleColor }}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};