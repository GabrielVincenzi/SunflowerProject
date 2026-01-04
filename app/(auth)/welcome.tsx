import CustomButton from "@/components/CustomButton";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const Onboarding = () => {
    const queryclient = useQueryClient();
    const { data } = useTranslations();
    if (!data) {
        return <View><Text>NO DATA</Text></View>
    }
    const t: any = data.payload;

    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === 3 - 1;

    return (
        <SafeAreaView className="flex h-full items-center justify-between bg-background">
            <TouchableOpacity
                onPress={() => { router.replace("/(tabs)/home") }}
                className="w-full flex justify-end items-end p-5"
            >
                <Text className="text-black text-medium font-elms-regular">{t.welcome.skip}</Text>
            </TouchableOpacity>
            <Swiper
                ref={swiperRef}
                loop={false}
                dot={<View className="w-[32px] h-[4px] mx-1 bg-slate-100 rounded-full" />}
                activeDot={<View className="w-[32px] h-[4px] mx-1 bg-accent rounded-full" />}
                onIndexChanged={(index) => setActiveIndex(index)}
            >
                {/*Slide 0*/}
                <View key={0} className="flex-1 px-4 pt-6">
                    <View className="flex-1 relative">
                        <View className="justify-start h-full pr-16">
                            <Text className="text-dark text-5xl font-elms-bold">{t.welcome.slides[0].title}</Text>
                            {t.welcome.slides[0].description ? (
                                <Text className="text-md font-semibold mt-4 text-grey">{t.welcome.slides[0].description}</Text>
                            ) : null}
                        </View>
                        <Image
                            source={images.sunflower}
                            className="w-full h-full absolute right-[-48px] bottom-[-128px]"
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/*Slide 1*/}
                <View key={1} className="flex-1">
                    <ImageBackground source={images.europe} style={{ flex: 1 }} resizeMode="cover">
                        <View className="flex-1 justify-center items-center px-6">
                            <Text className="text-dark text-5xl font-elms-bold text-center">{t.welcome.slides[1].title}</Text>

                        </View>
                    </ImageBackground>
                </View>

                {/*Slide 2*/}
                <View key={2} className="flex-1 pt-6">
                    <View className="flex-1 relative items-center">
                        <View className="justify-start h-full px-6">
                            <Text className="text-dark text-5xl font-elms-bold text-center">{t.welcome.slides[2].title}</Text>
                            <Text className="text-md font-semibold mt-4 text-grey text-center">{t.welcome.slides[2].description}</Text>
                        </View>
                        <Image
                            source={images.creativity}
                            className="w-full h-full absolute bottom-[-48px]"
                            resizeMode="cover"
                        />
                    </View>
                </View>
            </Swiper>
            <CustomButton
                title={isLastSlide ? t.welcome.buttons.getStarted : t.welcome.buttons.next}
                classname="w-11/12mt-10 bg-accent"
                textClassname="text-white"
                onPress={() => isLastSlide ? router.replace('/(auth)/sign-in') : swiperRef.current?.scrollBy(1)}
            />
        </SafeAreaView>
    )
}

export default Onboarding;

// Image for the screen:
//  