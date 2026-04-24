import ChartList from "@/components/ChartList";
import SunButton from "@/components/SunButton";
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const CategoryPage = () => {
    const { cat } = useLocalSearchParams();
    const category = Array.isArray(cat) ? cat[0] : cat ?? "";

    const renderHeader = () => (
        <Animated.View entering={FadeInDown.duration(800).delay(100)} className="px-6 mt-12 mb-10">
            {/* System Tag */}
            <View className="flex-row items-center gap-3 mb-4">
                <View className="h-[2px] w-10 bg-dark" />
                <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                    ARCHIVE // {category.toUpperCase()}
                </Text>
            </View>

            {/* Large Editorial Title */}
            <Text className="text-dark text-5xl tracking-tighter font-elms-bold italic capitalize leading-none">
                {category
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </Text>
        </Animated.View>
    );

    return (
        // Using the Canvas background as requested for data/list heavy screens
        <View className="flex-1 bg-primary">
            <View className="flex-1">
                <ChartList
                    searchQuery={""}
                    searchCategory={category}
                    renderHeader={renderHeader}
                    pageLimit={5}
                />
            </View>

            {/* Floating Back Button */}
            <View className="absolute bottom-4 left-0 right-0 px-8">
                <SunButton text="GO BACK" onPress={() => router.back()} />
            </View>
        </View>
    );
};

export default CategoryPage;