import InfiniteChartList from "@/components/InfiniteChartList";
import SunButton from "@/components/SunButton";
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from "react-native";

const CategoryPage = () => {
    const { cat } = useLocalSearchParams();
    const category = Array.isArray(cat) ? cat[0] : cat ?? "";

    const renderHeader = () => (
        <View className="px-6 mt-8 mb-4">
            <Text className="text-dark mb-4 text-4xl tracking-tight font-elms-bold capitalize">
                {category}
            </Text>
        </View>
    );

    return (
        <>
            <View className="flex-1 bg-background px-4 mt-4">
                {/* ChartList as the main scroller with the other parts as header */}
                <InfiniteChartList searchQuery={""} searchCategory={category} renderHeader={renderHeader} pageLimit={5} />
            </View>
            {/* Bottom button */}
            <SunButton text="Go back" />
        </>
    );
};

export default CategoryPage;