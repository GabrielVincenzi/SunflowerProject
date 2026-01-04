import CustomButton from "@/components/CustomButton"
import LanguageRotatingTitle from "@/components/RotatingTitle"
import { translationStorage } from "@/interfaces/translationStorage"
import { fetchTranslations } from "@/services/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQueryClient } from "@tanstack/react-query"
import { router } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, ScrollView, View } from "react-native"

const LanguageSelection = () => {
    const queryclient = useQueryClient();
    const [loading, setLoading] = useState(false)
    const welcomePageUrl = '/(auth)/welcome'

    const selectLanguage = async (lang: string) => {
        setLoading(true)
        await translationStorage.clear('it');

        const stored = await translationStorage.get('it');
        console.log('stored after clear:', stored);

        await queryclient.removeQueries({ queryKey: ['translations'] });
        const data = queryclient.getQueryData(['translations', lang]);
        console.log('Cached data for', lang, ':', data);

        await queryclient.fetchQuery({
            queryKey: ['translations', lang],
            queryFn: async () => {
                const stored = await translationStorage.get(lang);
                console.log("stored", stored, typeof stored)
                if (stored && Object.keys(stored).length > 0) return stored;

                const fresh = await fetchTranslations(lang);
                console.log("fresh", fresh, typeof fresh)
                await translationStorage.set(lang, fresh);
                return fresh;
            },
            staleTime: Infinity,
            gcTime: Infinity,
        });

        // optionally persist selected language
        await AsyncStorage.setItem('language', lang)
    }

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            className="flex-1 bg-background px-4">
            <View className="pt-10 pb-6 items-center gap-0">
                <LanguageRotatingTitle classname="mb-16" />
                <CustomButton
                    title="English"
                    classname="border"
                    onPress={async () => { await selectLanguage('en'); router.replace(welcomePageUrl); }} />
                <CustomButton
                    title="Italiano"
                    classname="border"
                    onPress={async () => { await selectLanguage('it'); router.replace(welcomePageUrl); }} />
                {loading && <ActivityIndicator />}
            </View>
        </ScrollView>
    )
}

export default LanguageSelection;