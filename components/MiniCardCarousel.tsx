import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import MiniCard from "@/components/cards/MiniCard";

export interface MiniCardCarouselItem {
    key: string;
    title: string;
    subtitle?: string;
    iconGlyph: keyof typeof Feather.glyphMap;
    isDark?: boolean;
    onPress: () => void;
}

interface MiniCardCarouselProps {
    label?: string;
    items: MiniCardCarouselItem[];
}

// Horizontal "today" row — small, low-commitment actions (search hint,
// restyle, profile, municipality). Self-contained so the label and the
// edge-to-edge scroll layout (deliberately breaking out of the page's
// horizontal padding) don't have to be reasoned about in the home page.
export default function MiniCardCarousel({ items }: MiniCardCarouselProps) {
    return (
        <View>
            <Animated.View entering={FadeInDown.duration(800).delay(500)}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 14, paddingVertical: 16 }}
                >
                    {items.map((item) => (
                        <MiniCard
                            key={item.key}
                            title={item.title}
                            subtitle={item.subtitle}
                            iconGlyph={item.iconGlyph}
                            isDark={item.isDark ?? false}
                            onPress={item.onPress}
                        />
                    ))}
                </ScrollView>
            </Animated.View>
        </View>
    );
};