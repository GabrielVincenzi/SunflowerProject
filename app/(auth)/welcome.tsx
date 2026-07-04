import SunButton from "@/components/SunButton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const SLIDE_META: { icon: keyof typeof Feather.glyphMap; image: any; label: string }[] = [
    { icon: "sun", image: images.sunflower, label: "IDENTITY" },
    { icon: "globe", image: images.europe, label: "THE NETWORK" },
    { icon: "feather", image: images.creativity, label: "THE GARDEN" },
];

const Onboarding = () => {
    const { data, isPending, isError, error } = useTranslations();
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    if (isPending) {
        return (
            <SafeAreaView className="flex h-full bg-background items-center justify-center">
                <ActivityIndicator color="#1A1A18" />
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView className="flex h-full bg-background items-center justify-center px-8">
                <Text className="font-elms-regular text-dark/60 text-center">
                    {error?.message || JSON.stringify(error) || "Unknown error"}
                </Text>
            </SafeAreaView>
        );
    }

    if (!data) {
        return (
            <SafeAreaView className="flex h-full bg-background items-center justify-center">
                <Text className="font-elms-regular text-dark/60">Error loading translations</Text>
            </SafeAreaView>
        );
    }

    const t: any = data.payload;
    const slides = t.welcome.slides as any[];
    const isLastSlide = activeIndex === slides.length - 1;

    const goNext = () =>
        isLastSlide ? router.replace("/(auth)/sign-in") : swiperRef.current?.scrollBy(1);

    return (
        <SafeAreaView className="flex h-full bg-background">
            {/* Ambient orbit rings — same Sun System motif used on Profile, introduced here first */}
            <View
                pointerEvents="none"
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-dark/[0.08]"
            />
            <View
                pointerEvents="none"
                className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-dark/[0.08]"
            />

            {/* Minimalist skip */}
            <TouchableOpacity
                onPress={() => router.replace("/(tabs)/home")}
                className="w-full flex items-end px-8 pt-4"
            >
                <Text className="text-dark/40 font-elms-bold uppercase tracking-[0.3em] text-[10px]">
                    {t.welcome.skip}
                </Text>
            </TouchableOpacity>

            <Swiper
                ref={swiperRef}
                loop={false}
                showsPagination={false}
                onIndexChanged={(index) => setActiveIndex(index)}
            >
                {slides.map((slide, index) => (
                    <OnboardingSlide key={index} index={index} slide={slide} active={activeIndex === index} />
                ))}
            </Swiper>

            {/* Progress dots + CTA */}
            <View className="px-8 pb-10">
                <View className="flex-row items-center justify-center mb-6">
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            className={`h-[3px] mx-1 rounded-full ${i === activeIndex ? "w-[40px] bg-primary" : "w-[24px] bg-dark/10"
                                }`}
                        />
                    ))}
                </View>

                {/* Brutalist "Next" button — hard shadow, translate only */}
                <View className="relative w-full">
                    <View
                        className="absolute inset-0 bg-dark rounded-[32px]"
                        style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                    />
                    <SunButton
                        text={(isLastSlide ? t.welcome.buttons.getStarted : t.welcome.buttons.next).toUpperCase()}
                        onPress={goNext}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

// Single-file convention: sub-component lives alongside the screen.
const OnboardingSlide = ({
    index,
    slide,
    active,
}: {
    index: number;
    slide: { title: string; description?: string };
    active: boolean;
}) => {
    const meta = SLIDE_META[index] ?? SLIDE_META[0];

    return (
        <View className="flex-1 px-8 pt-8">
            {/* Micro label + icon badge */}
            <View className="flex-row items-center mb-6">
                <View className="w-7 h-7 rounded-full bg-dark items-center justify-center mr-3">
                    <Feather name={meta.icon} size={13} color="#F7CE46" />
                </View>
                <Text className="font-elms-bold uppercase tracking-[0.25em] text-[10px] text-dark/40">
                    0{index + 1} — {meta.label}
                </Text>
            </View>

            {/* Hero image card — large SunCard pattern, rounded-[40px], hard shadow */}
            <View className="relative w-full h-[44%] mb-8">
                <View
                    className="absolute inset-0 bg-dark rounded-[40px]"
                    style={{ transform: [{ translateX: 8 }, { translateY: 8 }] }}
                />
                <View className="flex-1 bg-white rounded-[40px] border border-dark/10 overflow-hidden">
                    <Image source={meta.image} className="w-full h-full" resizeMode="cover" />
                    {/* Sunflower glow — the one deliberate yellow accent on this slide */}
                    <View className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/20" />
                    <View className="absolute -top-2 -right-2 w-14 h-14 rounded-full bg-primary/30" />
                </View>
            </View>

            {/* Copy — re-animates each time the slide becomes active */}
            {active && (
                <Animated.View key={index} entering={FadeInDown.duration(450).springify()}>
                    <View className="h-[2px] w-12 bg-primary mb-4" />
                    <Text className="text-dark text-4xl font-elms-bold italic tracking-tighter leading-tight">
                        {slide.title}
                    </Text>
                    {!!slide.description && (
                        <Text className="text-lg font-elms-regular italic mt-4 text-dark/55 leading-relaxed">
                            {slide.description}
                        </Text>
                    )}
                </Animated.View>
            )}
        </View>
    );
};

export default Onboarding;