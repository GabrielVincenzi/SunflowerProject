import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { MiniCard } from "@/components/cards/MiniCard";
import QuestionCard from "@/components/cards/QuestionCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import HomeHeader from "@/components/HomeHeader";
import QuestionPopup from "@/components/QuestionPopUp";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";

export default function Index() {
    const { data } = useTranslations();
    const [questionVisible, setQuestionVisible] = useState(false);

    if (!data) return null;
    const t: any = data.payload;

    return (
        <View className="flex-1 bg-primary">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="pt-14 pb-6 px-6">
                    {/* 1. Header - Cleaned up to match High-Impact spacing */}
                    <Animated.View entering={FadeInDown.duration(800).delay(100)}>
                        <HomeHeader
                            userName="Gabriel"
                            logo={images.logoMain}
                        />
                    </Animated.View>

                    {/* 2. Question of the Day - Shadow logic is inside the component */}
                    <Animated.View entering={FadeInDown.duration(800).delay(300)} className="mt-8">
                        <QuestionCard
                            title={t.home.questionOfTheDay}
                            onOpenPopup={() => setQuestionVisible(true)}
                        />
                    </Animated.View>

                    {/* 3. Inquiry Pathways */}
                    <Animated.View entering={FadeInDown.duration(800).delay(500)} className="mt-12">
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40 mb-6">
                            {t.home.sections.inquiryPathways}
                        </Text>
                        <View className="flex-row gap-5">
                            {/* Recommended (Dark Path) */}
                            <MiniCard isDark title={t.home.cards.goDeep.title} description={t.home.cards.goDeep.description} icon="01"
                                onPress={() => router.push("/categories/recomm")}>
                            </MiniCard>

                            {/* Random (White Path) */}
                            <MiniCard title={t.home.cards.popIt.title} description={t.home.cards.popIt.description} icon="02"
                                onPress={() => router.push("/categories/random")}>
                            </MiniCard>

                        </View>
                    </Animated.View>

                    {/* Temporary municipality & sponsorship buttons */}
                    <Animated.View entering={FadeInDown.duration(800).delay(500)} className="mt-12">
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40 mb-6">
                            {t.home.sections.specialNodes}
                        </Text>
                        <View className="flex-row gap-5">
                            {/* Sponsorship */}
                            <MiniCard title={t.home.cards.sponsorship.title} description={t.home.cards.sponsorship.description} icon="??"
                                onPress={() => router.push("/(sponsorship)")}>
                            </MiniCard>

                            {/* Municipality */}
                            <MiniCard title={t.home.cards.municipal.title} description={t.home.cards.municipal.description} icon="??"
                                onPress={() => router.push("/specific/municipality")}>
                            </MiniCard>

                        </View>
                    </Animated.View>

                    {/* 4. Categories (Vertical Archive) */}
                    <Animated.View entering={FadeInDown.duration(800).delay(700)} className="mt-16">
                        <View className="flex-row items-baseline gap-3 mb-8">
                            <Text className="text-4xl font-elms-bold tracking-tighter text-dark italic leading-none">By Category</Text>
                            <Text className="text-sm italic text-dark/30 font-elms-regular">{t.home.sections.byCategorySubtitle}</Text>
                        </View>
                        <CategoryCarousel />
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Question PopUp */}
            {questionVisible && (
                <QuestionPopup
                    title={t.home.questionOfTheDay}
                    onClose={() => setQuestionVisible(false)}
                />
            )}
        </View>
    );
}