import ChartList from '@/components/chartscomp/ChartList';
import SunButton from '@/components/SunButton';
import { useTranslations } from '@/services/useTranslation';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';

const RandomPage = () => {
    const { data } = useTranslations();
    if (!data) return null;
    const t: any = data.payload;

    const renderHeader = () => (
        <Animated.View entering={FadeInDown.duration(800).delay(100)} className="px-8 mt-12 mb-10">
            <View className="flex-row items-center gap-3 mb-4">
                <View className="h-[2px] w-10 bg-dark" />
                <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-dark/40">
                    {t.random.label}
                </Text>
            </View>
            <Text className="text-dark text-6xl tracking-tighter font-sf-bold italic leading-none">
                {t.random.title}
            </Text>
        </Animated.View>
    );

    return (
        <View className="flex-1 bg-[#FDFCF6]">
            <View className="flex-1">
                <ChartList
                    searchQuery={""}
                    renderHeader={renderHeader}
                    pageLimit={5}
                    random
                />
            </View>

            {/* Brutalist Back Button Container */}
            <View className="absolute bottom-4 left-0 right-0 px-8">
                <SunButton text={t.common.goBack} onPress={() => router.back()} />
            </View>
        </View>
    );
};

export default RandomPage;