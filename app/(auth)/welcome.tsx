import CustomButton from "@/components/CustomButton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const Onboarding = () => {
    const { data } = useTranslations();
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    if (!data) return null;
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
                    <Text className="text-dark text-7xl font-elms-bold italic tracking-tighter leading-[0.85]">{t.welcome.slides[0].title}</Text>
                    <Text className="text-xl font-elms-bold italic mt-8 text-dark/60 leading-relaxed">{t.welcome.slides[0].description}</Text>
                    <Image source={images.sunflower} className="w-[120%] h-full absolute right-[-100] bottom-[-200] opacity-20" resizeMode="contain" />
                </View>

                {/* Data Network Slide */}
                <View key={1} className="flex-1">
                    <ImageBackground source={images.europe} style={{ flex: 1 }} className="px-8 items-center justify-center opacity-80">
                        <View className="bg-dark p-10 rounded-[50px] border-4 border-primary">
                            <Text className="text-white text-5xl font-elms-bold italic text-center leading-none">{t.welcome.slides[1].title}</Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Creative Node Slide */}
                <View key={2} className="flex-1 px-8 pt-12 items-center">
                    <Text className="text-dark text-6xl font-elms-bold italic text-center tracking-tighter leading-none">{t.welcome.slides[2].title}</Text>
                    <Text className="text-xl font-elms-bold italic mt-6 text-dark/60 text-center">{t.welcome.slides[2].description}</Text>
                    <Image source={images.creativity} className="w-full h-1/2 absolute bottom-0" resizeMode="contain" />
                </View>
            </Swiper>

            {/* Brutalist "Next" Button */}
            <View className="px-8 pb-10">
                <View className="relative w-full">
                    <View className="absolute inset-0 bg-dark rounded-[32px] translate-y-2" />
                    <CustomButton
                        title={isLastSlide ? t.welcome.buttons.getStarted.toUpperCase() : t.welcome.buttons.next.toUpperCase()}
                        classname="bg-white border-2 border-dark py-6 rounded-[32px]"
                        textClassname="text-dark font-elms-bold italic text-xl tracking-widest"
                        onPress={() => isLastSlide ? router.replace('/(auth)/sign-in') : swiperRef.current?.scrollBy(1)}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Onboarding;