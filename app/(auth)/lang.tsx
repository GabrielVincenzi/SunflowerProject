import { useLanguage } from "@/components/LanguageContext";
import LanguageRotatingTitle from "@/components/RotatingTitle";
import SunButton from "@/components/SunButton";
import { translationStorage } from "@/interfaces/translationStorage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const LanguageSelection = () => {
    const { setLang } = useLanguage();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const selectLanguage = async (newLang: string) => {
        setLoading(true);

        // 1. Clear AsyncStorage for this lang — so queryFn doesn't short-circuit
        await translationStorage.clear(newLang);

        // 2. Remove RQ cache entry entirely — invalidateQueries isn't enough
        //    because staleTime: Infinity would still return the in-memory value
        queryClient.removeQueries({ queryKey: ['translations', newLang] });

        // 3. Update context — triggers useQuery to run queryFn fresh
        await setLang(newLang);

        requestAnimationFrame(() => {
            router.replace('/(auth)/welcome');
        });

        setLoading(false);
    };

    const LanguageNode = ({ title, onPress }: any) => (
        <View className="relative w-full mb-6">
            <View className="absolute mx-4 inset-0 bg-background rounded-[32px] translate-x-1.5 translate-y-1.5" />
            <SunButton text={title} onPress={onPress}
            />
        </View>
    );

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-primary px-8"
        >
            <View className="pt-24 pb-6 items-center">
                <View className="w-24 h-24 bg-dark rounded-[32px] items-center justify-center shadow-xl mb-12">
                    <Text className="text-primary font-elms-bold text-4xl italic">S</Text>
                </View>
                <LanguageRotatingTitle classname="mb-16" />
                <View className="w-full space-y-1">
                    <LanguageNode title="English" onPress={() => selectLanguage('en')} />
                    <LanguageNode title="Italiano" onPress={() => selectLanguage('it')} />
                </View>
                {loading && <ActivityIndicator color="#141414" className="mt-8" />}
            </View>
        </ScrollView>
    );
};

export default LanguageSelection;