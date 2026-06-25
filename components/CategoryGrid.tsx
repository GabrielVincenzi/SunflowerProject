import { fetchCategories } from '@/services/api';
import { useAuthFetch } from '@/services/useAuthFetch';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const VISIBLE_COUNT = 3; // 3 topic cards + "All topics" card = 4, matches the 2x2 grid

// Array of 4 random Feather icons to choose from
const RANDOM_ICONS: (keyof typeof Feather.glyphMap)[] = [
    'code',
    'book',
    'cloud',
    'bell',
];

export default function CategoryGrid({ onSelectTopic, onSeeAllTopics }: { onSelectTopic: (topicKey: string) => void; onSeeAllTopics: () => void; }) {
    const authFetch = useAuthFetch();
    const { data: categories, isLoading } = useQuery({
        queryKey: ['dbs', "categories"],
        queryFn: () => fetchCategories(authFetch),
    });

    // Transform categories: key = category, label = transformed category, icon = random from 4 choices
    const topics = categories
        ? categories.map((category: string) => {
            const key = category;
            const label = category
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            const icon = RANDOM_ICONS[Math.floor(Math.random() * RANDOM_ICONS.length)];

            return { key, label, icon };
        })
        : [];

    const visible = topics.slice(0, VISIBLE_COUNT);

    if (isLoading) {
        return <ActivityIndicator color="#FCD34D" className="my-10" />;
    }

    return (
        <View className="py-2 mb-2">
            <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40 mb-3">
                Browse by topic
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
                {visible.map((topic) => (
                    <TouchableOpacity
                        key={topic.key}
                        activeOpacity={0.85}
                        onPress={() => onSelectTopic(topic.key)}
                        className="bg-white border border-dark/10 rounded-2xl px-4 py-3.5"
                        style={{ width: '48%' }}
                    >
                        <Feather name={topic.icon} size={17} color="#5F5E5A" style={{ marginBottom: 8 }} />
                        <Text
                            className="text-[12.5px] font-elms-bold text-dark leading-snug"
                            numberOfLines={2}
                        >
                            {topic.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onSeeAllTopics}
                    className="bg-dark rounded-2xl px-4 py-3.5 justify-center"
                    style={{ width: '48%' }}
                >
                    <Text className="text-[12.5px] font-elms-bold text-primary leading-snug">
                        All topics
                    </Text>
                    <Text className="text-[10px] font-elms-regular text-white/50 mt-0.5">
                        {topics.length - VISIBLE_COUNT} more →
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}