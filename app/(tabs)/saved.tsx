import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import SunSavedCard from '@/components/cards/SunSavedCard';
import AnimatedItemWrapper from '@/components/WrapperEntranceList';
import { defaultLang } from '@/constants/utilities';
import { fetchSavedEvents } from '@/services/api';
import { useAuthFetch } from '@/services/useAuthFetch';

const Saved = () => {
    const { isSignedIn } = useAuth();
    const lang = defaultLang;
    const authFetch = useAuthFetch();

    const { data, isLoading } = useQuery({
        queryKey: ['charts', 'saved', lang],
        queryFn: () => fetchSavedEvents(lang, authFetch),
    });

    if (isLoading) return (
        <View className="flex-1 bg-[#FDFCF6] justify-center items-center">
            <ActivityIndicator color="#141414" />
        </View>
    );

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-[#FDFCF6]"
            // SHADOW FIX: Ensure the scrollview doesn't clip the shadow layers
            contentContainerStyle={{ overflow: 'visible' }}
        >
            <View className="px-8 pt-16 pb-40">
                {/* 1. High-Impact Header Section */}
                <Animated.View entering={FadeInDown.duration(800).delay(100)} className="mb-12">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[2px] w-10 bg-dark" />
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                            PERSONAL ARCHIVE // SAVED
                        </Text>
                    </View>
                    <Text className="text-dark text-5xl tracking-tighter font-elms-bold italic leading-tight">
                        Saved Signals
                    </Text>
                </Animated.View>

                {isSignedIn ? (
                    <FlatList
                        data={data}
                        scrollEnabled={false}
                        // SHADOW FIX: Adding paddingRight/Bottom prevents the card shadow from hitting the edge
                        contentContainerStyle={{ paddingRight: 8, paddingBottom: 8, overflow: 'visible' }}
                        renderItem={({ item, index }: ListRenderItemInfo<any>) => (
                            <AnimatedItemWrapper index={index}>
                                <View style={{ overflow: 'visible' }}>
                                    <SunSavedCard {...item} />
                                </View>
                            </AnimatedItemWrapper>
                        )}
                        keyExtractor={(item) => item.data.id.toString()}
                        ItemSeparatorComponent={() => <View className="h-4" />}
                        ListEmptyComponent={() => (
                            <View className="mt-20 items-center opacity-30">
                                <View className="w-16 h-1 bg-primary mb-8" />
                                <Text className="text-2xl font-elms-bold italic text-dark text-center">
                                    ARCHIVE EMPTY
                                </Text>
                            </View>
                        )}
                    />
                ) : (
                    <View className="mt-20 items-center justify-center p-10 bg-white rounded-[40px] border-2 border-dark">
                        <Text className="text-dark font-elms-bold italic text-3xl text-center">Access Restricted</Text>
                        <Text className="text-dark/40 font-elms-regular italic mt-4 text-center leading-relaxed">
                            Please sign in to access your personal signal archive.
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default Saved;