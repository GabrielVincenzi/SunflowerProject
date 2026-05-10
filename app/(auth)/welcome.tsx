import SunButton from "@/components/SunButton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const Onboarding = () => {
    const { data, isPending, isError } = useTranslations();
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    if (isPending) return <ActivityIndicator />;        // loading
    if (isError || !data) return <Text>Error loading translations</Text>; // actual failure

    const t: any = data.payload;
    const isLastSlide = activeIndex === 2;

    return (
        <SafeAreaView className="flex h-full bg-primary">
            {/* Minimalist System Skip */}
            <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} className="w-full flex items-end px-8 pt-4">
                <Text className="text-dark/40 font-elms-bold uppercase tracking-[0.4em] text-[10px]">{t.welcome.skip}</Text>
            </TouchableOpacity>

            <Swiper
                ref={swiperRef}
                loop={false}
                dot={<View className="w-[40px] h-[3px] mx-1 bg-dark/10 rounded-full" />}
                activeDot={<View className="w-[40px] h-[3px] mx-1 bg-dark rounded-full" />}
                onIndexChanged={(index) => setActiveIndex(index)}
            >
                {/* Visual Archetype Slide */}
                <View key={0} className="flex-1 px-8 pt-12">
                    <View className="h-[2px] w-12 bg-dark mb-6" />
                    <Text className="text-dark text-7xl font-elms-bold italic tracking-tighter">{t.welcome.slides[0].title}</Text>
                    <Text className="text-xl font-elms-bold italic mt-8 text-dark/60">{t.welcome.slides[0].description}</Text>
                    <Image source={images.sunflower} className="w-[120%] h-full absolute right-[-100] bottom-[-200] opacity-20" resizeMode="contain" />
                </View>

                {/* Data Network Slide */}
                <View key={1} className="flex-1">
                    <ImageBackground source={images.europe} style={{ flex: 1 }} className="px-8 items-center justify-center opacity-80">
                        <View className="bg-dark p-10 rounded-[50px] border-4 border-primary">
                            <Text className="text-white text-5xl font-elms-bold italic text-center">{t.welcome.slides[1].title}</Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Creative Node Slide */}
                <View key={2} className="flex-1 px-8 pt-12 items-center">
                    <Text className="text-dark text-6xl font-elms-bold italic text-center tracking-tighter">{t.welcome.slides[2].title}</Text>
                    <Text className="text-xl font-elms-bold italic mt-6 text-dark/60 text-center">{t.welcome.slides[2].description}</Text>
                    <Image source={images.creativity} className="w-full h-1/2 absolute bottom-0" resizeMode="contain" />
                </View>
            </Swiper>

            {/* Brutalist "Next" Button */}
            <View className="px-8 pb-10">
                <View className="relative w-full">
                    <View className="absolute mx-4 inset-0 bg-background rounded-[32px] translate-x-1.5 translate-y-1.5" />
                    <SunButton
                        text={isLastSlide ? t.welcome.buttons.getStarted.toUpperCase() : t.welcome.buttons.next.toUpperCase()}
                        onPress={() => isLastSlide ? router.replace('/(auth)/sign-in') : swiperRef.current?.scrollBy(1)}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Onboarding;