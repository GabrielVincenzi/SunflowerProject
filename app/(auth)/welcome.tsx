import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const Onboarding = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === onboarding.length - 1;

    const slide0 = onboarding[0] ?? { id: 's0', image: undefined as any, title: 'Welcome', description: '' };
    const slide1 = onboarding[1] ?? { id: 's1', image: undefined as any, title: 'Discover', description: '' };
    const slide2 = onboarding[2] ?? { id: 's2', image: undefined as any, title: 'Get Started', description: '' };

    return (
        <SafeAreaView className="flex h-full items-center justify-between bg-background">
            <TouchableOpacity
                onPress={() => { router.replace("/(tabs)/home") }}
                className="w-full flex justify-end items-end p-5"
            >
                <Text className="text-black text-medium font-elms-regular">Skip</Text>
            </TouchableOpacity>
            <Swiper
                ref={swiperRef}
                loop={false}
                dot={<View className="w-[32px] h-[4px] mx-1 bg-slate-100 rounded-full" />}
                activeDot={<View className="w-[32px] h-[4px] mx-1 bg-accent rounded-full" />}
                onIndexChanged={(index) => setActiveIndex(index)}
            >
                <View key={slide0.id} className="flex-1 px-4 pt-6">
                    <View className="flex-1 relative">
                        <View className="justify-start h-full pr-16">
                            <Text className="text-dark text-5xl font-elms-bold">{slide0.title}</Text>
                            {slide0.description ? (
                                <Text className="text-md font-semibold mt-4 text-grey">{slide0.description}</Text>
                            ) : null}
                        </View>
                        {slide0.image ? (
                            <Image
                                source={slide0.image}
                                className="w-full h-full absolute right-[-48px] bottom-[-128px]"
                                resizeMode="cover"
                            />
                        ) : null}
                    </View>
                </View>
                <View key={slide1.id} className="flex-1">
                    {slide1.image ? (
                        <ImageBackground source={slide1.image} style={{ flex: 1 }} resizeMode="cover">
                            <View className="flex-1 justify-center items-center px-6">
                                <Text className="text-dark text-5xl font-elms-bold text-center">{slide1.title}</Text>
                                {slide1.description ? (
                                    <Text className="text-md font-semibold text-center mx-10 mt-3 text-grey">{slide1.description}</Text>
                                ) : null}
                            </View>
                        </ImageBackground>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-dark text-5xl font-elms-bold">{slide1.title}</Text>
                        </View>
                    )}
                </View>
                <View key={slide2.id} className="flex-1 pt-6">
                    <View className="flex-1 relative items-center">
                        <View className="justify-start h-full px-6">
                            <Text className="text-dark text-5xl font-elms-bold text-center">{slide2.title}</Text>
                            {slide2.description ? (
                                <Text className="text-md font-semibold mt-4 text-grey  text-center">{slide2.description}</Text>
                            ) : null}
                        </View>
                        {slide2.image ? (
                            <Image
                                source={slide2.image}
                                className="w-full h-full absolute bottom-[-48px]"
                                resizeMode="cover"
                            />
                        ) : null}
                    </View>
                </View>
            </Swiper>
            <CustomButton
                title={isLastSlide ? "Get Started" : "Next"}
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