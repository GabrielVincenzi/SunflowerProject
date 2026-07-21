import OptionCard from "@/components/cards/OptionCard";
import OutlineFlower from "@/components/design/OutlineSunFlower";
import { useLanguage } from "@/components/layoutcomp/LanguageContext";
import SunButton from "@/components/SunButton2";
import { LANGUAGE_TITLES, THEME_COLORS } from "@/constants/utilities";
import { translationStorage } from "@/interfaces/translationStorage";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const LANGUAGES = [
    { code: "en", label: "English", description: "Use the app in English" },
    { code: "it", label: "Italiano", description: "Usa l'app in italiano" },
];

const LanguageSelection = () => {
    const { setLang } = useLanguage();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [index, setIndex] = useState(0);
    const queryClient = useQueryClient();
    const opacity = useSharedValue(1);

    useEffect(() => {
        const interval = setInterval(() => {
            opacity.value = withTiming(0, { duration: 250 });
            setIndex((prev) => (prev + 1) % LANGUAGE_TITLES.length);
            opacity.value = withTiming(1, { duration: 250 });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const confirmLanguage = async () => {
        if (!selected) return;
        setLoading(true);

        try {
            // 1. Clear AsyncStorage for this lang — so queryFn doesn't short-circuit
            await translationStorage.clear(selected);

            // 2. Remove RQ cache entry entirely — invalidateQueries isn't enough
            //    because staleTime: Infinity would still return the in-memory value
            queryClient.removeQueries({ queryKey: ["translations", selected] });

            // 3. Update context — triggers useQuery to run queryFn fresh
            await setLang(selected);

            requestAnimationFrame(() => {
                router.replace("/(auth)/welcome");
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-background px-8"
        >
            <View className="pt-24 pb-6 items-center">
                <OutlineFlower size={140} />

                <Animated.Text
                    style={animatedStyle}
                    className="text-dark text-2xl font-sf-bold text-center mb-2 mt-4"
                >
                    {LANGUAGE_TITLES[index]}
                </Animated.Text>

                <Text
                    className="font-sf-regular text-[13px] text-center mb-10"
                    style={{ color: "rgba(52,58,64,0.5)" }}
                >
                    Choose your language to continue
                </Text>

                <View className="w-full gap-4 mb-10">
                    {LANGUAGES.map((l, i) => (
                        <OptionCard
                            key={l.code}
                            icon="globe"
                            label={l.label}
                            description={l.description}
                            selected={selected === l.code}
                            onPress={() => setSelected(l.code)}
                            delay={100 + i * 70}
                            active={true}
                        />
                    ))}
                </View>

                <SunButton
                    label={loading ? "Loading..." : "Continue"}
                    icon={
                        !loading && (
                            <Feather name="arrow-right" size={15} color={THEME_COLORS.background} />
                        )
                    }
                    onPress={confirmLanguage}
                    disabled={!selected || loading}
                />
            </View>
        </ScrollView>
    );
};

export default LanguageSelection;