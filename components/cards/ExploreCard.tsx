import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ExploreCardProps {
    iconGlyph: keyof typeof Feather.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
}

// Same row treatment as CategoryCard (6px shadow offset, rounded-24,
// dark border, arrow-right circle) but leads with an icon instead of
// a numeric index — used for the vertical "explore" list (recommended,
// random, municipality, educational tools) rather than category browsing.
export default function ExploreCard({ iconGlyph, title, subtitle, onPress }: ExploreCardProps) {
    return (
        <View className="relative w-full mb-5">
            {/* Shadow layer */}
            <View
                className="absolute inset-0 bg-dark rounded-[24px]"
                style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />

            {/* Content layer */}
            <TouchableOpacity
                activeOpacity={0.9}
                className="w-full bg-white rounded-[24px] border-2 border-dark overflow-hidden flex-row items-center p-5"
                onPress={onPress}
            >
                <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-5"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                >
                    <Feather name={iconGlyph} size={16} color={THEME_COLORS.dark} />
                </View>

                <View className="flex-1">
                    <Text className="text-cardtitle">{title}</Text>
                    {subtitle && (
                        <Text className="text-motto text-dark/40">{subtitle}</Text>
                    )}
                </View>

                <View className="bg-dark w-10 h-10 rounded-full items-center justify-center">
                    <Feather name="arrow-right" size={16} color="#ffffff" />
                </View>
            </TouchableOpacity>
        </View>
    );
};