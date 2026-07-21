import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface QuestionCardProps {
    title: string;
    description?: string;
    image?: string;
    onOpenPopup: () => void;
    /**
     * Whether this is the user's first time seeing this question.
     * Drives the card's visual state and label copy.
     */
    isFirstEncounter?: boolean;
    /**
     * The belief the user recorded on their first encounter.
     * Shown as a teaser on return visits.
     */
    priorBelief?: string;
    /**
     * Consecutive correct answers streak (return visits only).
     */
    streak?: number;
}

export default function QuestionJourneyCard({
    title,
    description,
    image,
    onOpenPopup,
    isFirstEncounter = true,
    priorBelief,
    streak = 0,
}: QuestionCardProps) {
    // Strip the confidence tag stored in the belief string before displaying.
    const cleanBelief = priorBelief?.replace(/ \[confidence: \w+\]/, "") ?? "";

    return (
        <View className="relative w-full mb-4">
            {/* Hard shadow layer */}
            <View
                className="absolute inset-0 bg-dark rounded-[40px]"
                style={{ transform: [{ translateX: 8 }, { translateY: 8 }] }}
            />

            {/* Content layer */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onOpenPopup}
                className="bg-white p-8 rounded-[40px] border-2 border-dark relative overflow-hidden"
            >
                {/* Decorative background circle */}
                <View
                    className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full"
                    style={{ transform: [{ scale: 1.5 }] }}
                />

                {/* Yellow left accent */}
                <View className="absolute left-0 top-1/3 bottom-1/3 w-[4px] bg-primary" />

                <View className="flex-row items-start relative">
                    {/* Optional image */}
                    {image && (
                        <Image
                            source={{ uri: image }}
                            className="w-16 h-16 rounded-[16px] mr-5 bg-dark/5 border border-dark/10"
                            resizeMode="cover"
                        />
                    )}

                    <View className="flex-1 justify-center">
                        {/* Micro-tag — changes based on encounter state */}
                        <View className="flex-row items-center gap-2 mb-2">
                            <View
                                className={`w-2 h-2 rounded-full ${isFirstEncounter ? "bg-primary opacity-80" : "bg-dark opacity-20"
                                    }`}
                            />
                            <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.3em]">
                                {isFirstEncounter ? "First Encounter" : "Daily Synthesis"}
                            </Text>

                            {/* Streak badge — return visits only */}
                            {!isFirstEncounter && streak > 0 && (
                                <View className="ml-auto flex-row items-center gap-1 bg-dark/5 px-2 py-0.5 rounded-full">
                                    <Feather name="zap" size={10} color="#141414" />
                                    <Text className="text-[10px] font-sf-bold text-dark/50">
                                        {streak}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Title */}
                        <Text
                            className="text-3xl font-sf-bold italic text-dark tracking-tighter leading-tight"
                            numberOfLines={2}
                        >
                            {title}
                        </Text>

                        {/* First encounter: show description as usual */}
                        {isFirstEncounter && description && (
                            <Text
                                className="text-sm font-sf-regular italic text-dark/60 mt-3 leading-relaxed"
                                numberOfLines={2}
                            >
                                {description}
                            </Text>
                        )}

                        {/* Return visit: show the user's prior belief as a teaser */}
                        {!isFirstEncounter && cleanBelief && (
                            <View className="mt-3 bg-primary/10 rounded-[12px] px-3 py-2">
                                <Text className="text-[10px] font-sf-bold text-dark/30 uppercase tracking-[0.2em] mb-1">
                                    YOUR BELIEF
                                </Text>
                                <Text
                                    className="text-sm font-sf-regular italic text-dark/60 leading-relaxed"
                                    numberOfLines={2}
                                >
                                    "{cleanBelief}"
                                </Text>
                            </View>
                        )}

                        {/* Return visit, no prior belief recorded yet */}
                        {!isFirstEncounter && !cleanBelief && description && (
                            <Text
                                className="text-sm font-sf-regular italic text-dark/60 mt-3 leading-relaxed"
                                numberOfLines={2}
                            >
                                {description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Bottom row — CTA hint */}
                <View className="flex-row items-center justify-end mt-5 gap-1 opacity-30">
                    <Text className="text-[10px] font-sf-bold uppercase tracking-[0.2em] text-dark">
                        {isFirstEncounter ? "Record belief" : "Test synthesis"}
                    </Text>
                    <Feather name="arrow-right" size={12} color="#141414" />
                </View>
            </TouchableOpacity>
        </View>
    );
}