import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import ExploreCard from "@/components/cards/ExploreCard";

export interface ExploreCardListItem {
    key: string;
    title: string;
    subtitle?: string;
    iconGlyph: keyof typeof Feather.glyphMap;
    onPress: () => void;
}

interface ExploreCardListProps {
    title: string;
    subtitle?: string;
    items: ExploreCardListItem[];
}

// Vertical "explore" list — recommended, random, municipality,
// educational tools. Owns its own section header so the whole
// "subtitle + stacked rows" block travels as one unit wherever it's used.
export default function ExploreCardList({ title, subtitle, items }: ExploreCardListProps) {
    return (
        <View>
            <Animated.View entering={FadeInDown.duration(800).delay(650)} className="mb-7">
                <Text className="text-[28px] font-sf-bold tracking-tight text-dark italic leading-none">
                    {title}
                </Text>
                {subtitle && (
                    <Text className="text-[13px] italic text-dark/35 font-sf-regular mt-2">
                        {subtitle}
                    </Text>
                )}
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(750)}>
                {items.map((item) => (
                    <ExploreCard
                        key={item.key}
                        title={item.title}
                        subtitle={item.subtitle}
                        iconGlyph={item.iconGlyph}
                        onPress={item.onPress}
                    />
                ))}
            </Animated.View>
        </View>
    );
};