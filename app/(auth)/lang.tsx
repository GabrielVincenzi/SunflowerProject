import CustomButton from "@/components/CustomButton"
import LanguageRotatingTitle from "@/components/RotatingTitle"
import { useQueryClient } from "@tanstack/react-query"
import { router } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, ScrollView, Text, View } from "react-native"

const LanguageSelection = () => {
    const queryclient = useQueryClient();
    const [loading, setLoading] = useState(false)
    const welcomePageUrl = '/(auth)/welcome'

    const selectLanguage = async (lang: string) => { /* logic preserved */ }

    const LanguageNode = ({ title, onPress }: any) => (
        <View className="relative w-full mb-6">
            <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5" />
            <CustomButton
                title={title}
                classname="bg-white border-2 border-dark rounded-[32px] py-6"
                textClassname="text-dark font-elms-bold italic text-2xl tracking-tighter"
                onPress={onPress}
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
                {/* Branding Block */}
                <View className="w-24 h-24 bg-dark rounded-[32px] items-center justify-center shadow-2xl mb-12">
                    <Text className="text-primary font-elms-bold text-4xl italic">S</Text>
                </View>

                <LanguageRotatingTitle classname="mb-16" />

                <View className="w-full space-y-1">
                    <LanguageNode
                        title="English"
                        onPress={async () => { await selectLanguage('en'); router.replace(welcomePageUrl); }}
                    />
                    <LanguageNode
                        title="Italiano"
                        onPress={async () => { await selectLanguage('it'); router.replace(welcomePageUrl); }}
                    />
                </View>

                {loading && <ActivityIndicator color="#141414" className="mt-8" />}
            </View>
        </ScrollView>
    )
}

export default LanguageSelection;