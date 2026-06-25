import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { MiniCard } from "@/components/cards/MiniCard";
import QuestionCard from "@/components/cards/QuestionCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import ManipulatorsStudio from "@/components/eductools/ManipulationStudio";
import HomeHeader from "@/components/HomeHeader";
import QuestionPopup from "@/components/popup/QuestionPopUp";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { useUser } from "@clerk/clerk-expo";

export default function Index() {
    const { user } = useUser();
    const { data } = useTranslations();
    const [questionVisible, setQuestionVisible] = useState(false);
    const [studioVisible, setStudioVisible] = useState(false);

    if (!data || user === undefined) return <HomeSkeleton />;
    const t: any = data.payload;

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="pt-14 pb-6 px-6">
                    {/* 1. Header */}
                    <Animated.View entering={FadeInDown.duration(800).delay(100)}>

                        <HomeHeader
                            userName={user?.firstName ?? user?.username ?? user?.emailAddresses[0].emailAddress}
                            logo={images.logoMain}
                        />
                    </Animated.View>

                    {/* 2. Today's question — the daily ritual, now with its
                        own visual identity (sun glow + streak pips) rather
                        than sharing the generic featured-card treatment */}
                    <Animated.View entering={FadeInDown.duration(800).delay(300)} className="mt-8">
                        <QuestionCard
                            title={t.home.questionOfTheDay}
                            onOpenPopup={() => setQuestionVisible(true)}
                            streak={t.home.questionStreak ?? 0}
                        />
                    </Animated.View>

                    {/* 3. Today's light — the featured tool entry */}
                    <Animated.View entering={FadeInDown.duration(800).delay(400)} className="mt-5">
                        <View className="flex-row items-center gap-2.5 mb-3 px-1">
                            <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40">
                                Today's light
                            </Text>
                        </View>
                        <View className="relative w-full">
                            <View
                                className="absolute inset-0 bg-dark rounded-[36px]"
                                style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                            />
                            <View className="bg-dark rounded-[36px] p-7 overflow-hidden">
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute', top: -34, right: -28,
                                        width: 120, height: 120, borderRadius: 60,
                                        backgroundColor: '#F7CE46', opacity: 0.14,
                                    }}
                                />
                                <Text className="text-[11px] font-elms-bold uppercase tracking-[0.15em] text-primary/70 mb-2">
                                    Manipulator's Studio
                                </Text>
                                <Text className="text-[21px] font-elms-bold italic text-white leading-snug mb-2.5">
                                    Make crime look like it's rising
                                </Text>
                                <Text className="text-[13px] font-elms-regular text-white/55 leading-relaxed mb-5">
                                    Bend a real chart to fit a claim — then see what the full data actually shows.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setStudioVisible(true)}
                                    activeOpacity={0.85}
                                    className="self-start bg-primary px-5 py-2.5 rounded-full flex-row items-center gap-2"
                                >
                                    <Text className="text-[11px] font-elms-bold text-dark uppercase tracking-[0.08em]">
                                        Turn towards it
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    {/* 4. Growing now (was "Inquiry Pathways") */}
                    <Animated.View entering={FadeInDown.duration(800).delay(500)} className="mt-12">
                        <Text className="text-[11px] uppercase font-elms-bold tracking-[0.12em] text-dark/40 mb-5">
                            Growing now
                        </Text>
                        <View className="flex-row gap-5">
                            <MiniCard
                                isDark
                                title={t.home.cards.goDeep.title}
                                subtitle={t.home.cards.goDeep.description}
                                iconGlyph="trending-up"
                                onPress={() => router.push("/categories/recomm")}
                            />
                            <MiniCard
                                title={t.home.cards.popIt.title}
                                subtitle={t.home.cards.popIt.description}
                                iconGlyph="shuffle"
                                onPress={() => router.push("/categories/random")}
                            />
                        </View>
                    </Animated.View>

                    {/* 5. From the greenhouse (was "Special Nodes" with
                        literal "??" icon placeholders) */}
                    <Animated.View entering={FadeInDown.duration(800).delay(550)} className="mt-10">
                        <Text className="text-[11px] uppercase font-elms-bold tracking-[0.12em] text-dark/40 mb-5">
                            From the greenhouse
                        </Text>
                        <View className="flex-row gap-5">
                            <MiniCard
                                title="Time Machine"
                                subtitle="predict the future"
                                iconGlyph="award"
                                onPress={() => router.push("/(sponsorship)")}
                            />
                            <MiniCard
                                title={t.home.cards.municipal.title}
                                subtitle={t.home.cards.municipal.description}
                                iconGlyph="map-pin"
                                onPress={() => router.push("/specific/municipality")}
                            />
                        </View>
                    </Animated.View>

                    {/* 6. By category */}
                    <Animated.View entering={FadeInDown.duration(800).delay(700)} className="mt-14">
                        <View className="flex-row items-baseline gap-3 mb-7">
                            <Text className="text-[28px] font-elms-bold tracking-tight text-dark italic leading-none">
                                By category
                            </Text>
                            <Text className="text-[13px] italic text-dark/35 font-elms-regular">
                                {t.home.sections.byCategorySubtitle}
                            </Text>
                        </View>
                        <CategoryCarousel />
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Question popup */}
            {questionVisible && (
                <QuestionPopup onClose={() => setQuestionVisible(false)} />
            )}

            {/* Manipulator's Studio — opened from the "Today's light" card */}
            {studioVisible && (
                <ManipulatorsStudio onClose={() => setStudioVisible(false)} />
            )}
        </View>
    );
}