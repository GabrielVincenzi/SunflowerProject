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

export default function Index() {
    const [questionVisible, setQuestionVisible] = useState(false);

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
                            onLogoPress={() => console.log("logo pressed")}
                        />
                    </Animated.View>

                    {/* 2. Question of the Day - Shadow logic is inside the component */}
                    <Animated.View entering={FadeInDown.duration(800).delay(300)} className="mt-8">
                        <QuestionCard
                            title="Question of the Day"
                            onOpenPopup={() => setQuestionVisible(true)}
                        />
                    </Animated.View>

                    {/* 3. Inquiry Pathways */}
                    <Animated.View entering={FadeInDown.duration(800).delay(500)} className="mt-12">
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40 mb-6">
                            INQUIRY PATHWAYS
                        </Text>
                        <View className="flex-row gap-5">
                            {/* Recommended (Dark Path) */}
                            <MiniCard isDark title="Go Deep" description="Expert Path" icon="01"
                                onPress={() => router.push("/categories/recomm")}>
                            </MiniCard>

                            {/* Random (White Path) */}
                            <MiniCard title="Pop it" description="Pop Bubble" icon="02"
                                onPress={() => router.push("/categories/random")}>
                            </MiniCard>

                        </View>
                    </Animated.View>

                    {/* Temporary municipality & sponsorship buttons */}
                    <Animated.View entering={FadeInDown.duration(800).delay(500)} className="mt-12">
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40 mb-6">
                            SPECIAL NODES
                        </Text>
                        <View className="flex-row gap-5">
                            {/* Sponsorship */}
                            <MiniCard title="Sponsors" description="Inquiry Labs" icon="??"
                                onPress={() => router.push("/(sponsorship)")}>
                            </MiniCard>

                            {/* Municipality */}
                            <MiniCard title="Municipal" description="Local Data" icon="??"
                                onPress={() => router.push("/specific/municipality")}>
                            </MiniCard>

                        </View>
                    </Animated.View>

                    {/* 4. Categories (Vertical Archive) */}
                    <Animated.View entering={FadeInDown.duration(800).delay(700)} className="mt-16">
                        <View className="flex-row items-baseline gap-3 mb-8">
                            <Text className="text-4xl font-elms-bold tracking-tighter text-dark italic leading-none">By Category</Text>
                            <Text className="text-sm italic text-dark/30 font-elms-regular">Archive</Text>
                        </View>
                        <CategoryCarousel />
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Question PopUp */}
            {questionVisible && (
                <QuestionPopup
                    title="Question of the Day"
                    onClose={() => setQuestionVisible(false)}
                />
            )}
        </View>
    );
}