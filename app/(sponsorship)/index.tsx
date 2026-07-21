import { router } from "expo-router";
import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const TYPE_CARDS = [
    {
        route: "/(sponsorship)/signal",
        label: "Signal Sponsorship",
        sub: "Backend selects matching questions for your brand",
        dark: true,
    },
    {
        route: "/(sponsorship)/inquiry",
        label: "Inquiry Creation",
        sub: "Build a question and attach it to a specific chart",
        dark: false,
    },
    {
        route: "/(sponsorship)/event",
        label: "Event Sponsorship",
        sub: "Promote your event directly in the Sunflower feed",
        dark: false,
    },
];

export default function SponsorshipEntry() {
    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="dark-content" />
            <View
                className="flex-1 px-4 pb-12">
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(800).delay(100)} className="px-6 mt-12 mb-8">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="h-[1px] w-8 bg-primary" />
                        <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-grey/60">
                            Sponsorship
                        </Text>
                    </View>
                    <Text className="text-dark text-5xl tracking-tighter font-sf-bold capitalize leading-tight">
                        Amplify{"\n"}your signal.
                    </Text>
                    <Text className="text-base font-sf-regular text-grey leading-relaxed">
                        Choose how you want to reach the Sunflower community.
                    </Text>
                </Animated.View>

                {/* Type cards */}
                <View className="flex-1 gap-4">
                    {TYPE_CARDS.map((card, i) => (
                        <Animated.View key={card.route} entering={FadeInDown.duration(600).delay(200 + i * 100)}>
                            <TouchableOpacity
                                onPress={() => router.push(card.route as any)}
                                activeOpacity={0.85}
                                className={`w-full rounded-[28px] p-6 flex-row items-center gap-4 ${card.dark
                                    ? "bg-dark"
                                    : "bg-light/40 border border-dark/5"
                                    }`}
                            >
                                {/* Placeholder icon */}
                                <View
                                    className={`w-14 h-14 rounded-2xl items-center justify-center ${card.dark ? "bg-primary/20" : "bg-dark/5"
                                        }`}
                                />

                                {/* Choice Text */}
                                <View className="flex-1">
                                    <Text
                                        className={`text-xl font-sf-bold tracking-tight leading-tight mb-1 ${card.dark ? "text-light" : "text-dark"
                                            }`}>{card.label}
                                    </Text>
                                    <Text
                                        className={`text-xs font-sf-regular leading-relaxed ${card.dark ? "text-light/40" : "text-grey"
                                            }`}
                                    >
                                        {card.sub}
                                    </Text>
                                </View>
                                <Text
                                    className={`text-2xl ${card.dark ? "text-light/20" : "text-dark/15"
                                        }`}>›
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Footer note */}
                <Animated.View
                    entering={FadeInDown.duration(600).delay(600)}
                    className="mt-8 items-center"
                >
                    <Text className="text-[10px] font-s-bold uppercase tracking-widest text-grey/30">
                        All sponsorships reviewed within 24 h
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
}
