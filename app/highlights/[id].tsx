import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Reusable stat item
const StatItem = ({ value, description }: HighlightProps) => (
    <View className="w-full border-b border-gray-300 py-6 flex-row items-end">
        <Text className="text-7xl font-bold text-neutral-800 mt-10">{value}</Text>
        <Text className="text-neutral-500 leading-relaxed text-base mx-6 flex-shrink">
            {description}
        </Text>
    </View>
);

export default function App() {
    const data = [
        { id: "1", percentage: 55, description: "Entertainment purposes" },
        { id: "2", percentage: 35, description: "Stay in touch with current friends and family members" },
        { id: "3", percentage: 10, description: "Get useful information, and connect with learning groups" },
        { id: "4", percentage: 10, description: "Get useful information, and connect with learning groups" },
        { id: "5", percentage: 10, description: "Get useful information, and connect with learning groups" },
    ];

    return (
        <SafeAreaView className="bg-background flex-1">
            <View className="px-6 mt-8 mb-4">
                <Text className="text-neutral-900 mb-4 font-bold text-3xl tracking-tight">
                    How people use social media?
                </Text>
            </View>
            <View className="px-10">
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <StatItem value={item.percentage} description={item.description} />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
}
