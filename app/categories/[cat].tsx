import InfiniteChartList from "@/components/InfiniteChartList";
import { icons } from '@/constants/icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from "react-native";

const CategoryPage = () => {
    const { cat } = useLocalSearchParams();
    const category = Array.isArray(cat) ? cat[0] : cat ?? "";

    const renderHeader = () => (
        <View className="px-6 mt-8 mb-4">
            <Text className="text-dark mb-4 text-4xl tracking-tight font-elms-bold">
                {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
            </Text>
        </View>
    );

    return (
        <>
            <View className="flex-1 bg-background px-4">
                {/* ChartList as the main scroller with the other parts as header */}
                <InfiniteChartList searchQuery={""} searchCategory={category} renderHeader={renderHeader} pageLimit={5} />
            </View>
            {/* Bottom button */}
            <TouchableOpacity
                className="absolute bottom-6 left-6 right-6 bg-secondary rounded-2xl py-4 flex-row items-center justify-center"
                onPress={() => router.back()}
                activeOpacity={0.85}
            >
                <Image source={icons.arrow} className="size-5 mr-2 rotate-180" tintColor="#fff" />
                <Text className="text-white font-semibold text-base">Go back</Text>
            </TouchableOpacity>
        </>
    );
};

export default CategoryPage;