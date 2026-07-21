import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import QuestionCard from "@/components/cards/QuestionCard";
import ExploreCardList, { ExploreCardListItem } from "@/components/ExploreCardList";
import HomeHeader from "@/components/layoutcomp/HomeHeader";
import MiniCardCarousel, { MiniCardCarouselItem } from "@/components/MiniCardCarousel";
import QuestionPopup from "@/components/popup/QuestionPopUp";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { useUser } from "@clerk/clerk-expo";

export default function Index() {
    const { user } = useUser();
    const { data } = useTranslations();
    const [questionVisible, setQuestionVisible] = useState(false);

    if (!data || user === undefined) return <HomeSkeleton />;
    const t: any = data.payload;

    // The first item is the deliberate search hint (isDark = true, the
    // "main" pick in the row). Rest are small, low-commitment actions.
    const todayItems: MiniCardCarouselItem[] = [
        {
            key: "search",
            title: "Find a chart",
            subtitle: "search anything",
            iconGlyph: "search",
            isDark: true,
            onPress: () => router.push("/search"), // adjust to your actual search route
        },
        {
            key: "customize",
            title: "Restyle",
            subtitle: "change look",
            iconGlyph: "sliders",
            onPress: () => router.push("/tools/customize"), // TODO: confirm real route
        },
        {
            key: "profile",
            title: "Your progress",
            subtitle: "see your progress",
            iconGlyph: "award",
            onPress: () => router.push("/profile"), // TODO: confirm real route
        },
        {
            key: "municipality-today",
            title: "Your town",
            subtitle: "discover local data",
            iconGlyph: "map-pin",
            onPress: () => router.push("/specific/municipality"),
        },
    ];

    const exploreItems: ExploreCardListItem[] = [
        {
            key: "recommended",
            title: t.home.cards.goDeep.title,
            subtitle: t.home.cards.goDeep.description,
            iconGlyph: "trending-up",
            onPress: () => router.push("/categories/recomm"),
        },
        {
            key: "random",
            title: t.home.cards.popIt.title,
            subtitle: t.home.cards.popIt.description,
            iconGlyph: "shuffle",
            onPress: () => router.push("/categories/random"),
        },
        {
            key: "municipality",
            title: t.home.cards.municipal.title,
            subtitle: t.home.cards.municipal.description,
            iconGlyph: "map-pin",
            onPress: () => router.push("/specific/municipality"),
        },
        {
            key: "education",
            title: "Educational tools",
            subtitle: "learn how to read data",
            iconGlyph: "book-open",
            onPress: () => router.push("/tools/education"), // TODO: confirm real route
        },
    ];

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="pt-14 px-6">
                    {/* 1. Greeting */}
                    <Animated.View entering={FadeInDown.duration(800).delay(100)}>
                        <HomeHeader
                            userName={user?.firstName ?? user?.username ?? user?.emailAddresses[0].emailAddress}
                            logo={images.logoMain}
                        />
                    </Animated.View>

                    {/* 2. Question of the Day — the hero */}
                    <Animated.View entering={FadeInDown.duration(800).delay(300)} className="mt-8">
                        <QuestionCard
                            title={t.home.questionOfTheDay}
                            onOpenPopup={() => setQuestionVisible(true)}
                            streak={t.home.questionStreak ?? 0}
                        />
                    </Animated.View>
                </View>

                {/* 3. Today for you — horizontal carousel */}
                <View>
                    <MiniCardCarousel items={todayItems} />
                </View>

                {/* 4 & 5. Subtitle + vertical explore list */}
                <View className="px-6 mt-12">
                    <ExploreCardList
                        title="More to explore"
                        subtitle="recommended, random, your town, and how to read it all"
                        items={exploreItems}
                    />
                </View>
            </ScrollView>

            {/* Question popup */}
            {questionVisible && (
                <QuestionPopup onClose={() => setQuestionVisible(false)} />
            )}
        </View>
    );
}