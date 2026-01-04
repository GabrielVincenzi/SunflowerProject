import QuestionCard from "@/components/cards/QuestionCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import HomeHeader from "@/components/HomeHeader";
import { images } from "@/constants/images";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            className="flex-1 bg-background px-4">
            <View className="pt-10 pb-6">
                <HomeHeader
                    userName="Gabriel"
                    logo={images.logoMain}
                    avatar={images.sunflower}
                    onLogoPress={() => console.log("logo pressed")}
                    onNotifPress={() => { }}
                />

                {/* Question of the day */}
                <QuestionCard title="Question" />

                {/* Categories title + horizontal list */}
                <Text className="mt-6 mb-4 font-elms-bold text-xl text-dark">By Category</Text>
                <CategoryCarousel />

                {/* Charts title (the ChartList will render the actual items) */}
                <Text className="mt-10 mb-2 font-elms-bold text-xl text-dark">And Today What?</Text>
                <View className="flex-row gap-4 px-4 items-center justify-center">
                    <TouchableOpacity
                        className='w-1/2 rounded-xl py-16 px-4 flex flex-row border-dark bg-marked items-center justify-center'
                        style={{ borderWidth: 1 }}
                        activeOpacity={1}
                        onPress={() => router.push("/categories/recomm")}>
                        <View className='flex-col'>
                            <Text className='text-base text-center font-elms-bold text-light mt-2' numberOfLines={1}>Recommended</Text>
                            <Text className='text-sm text-center font-medium mt-1 text-light'>Become an Expert</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='w-1/2 rounded-xl py-16 px-4 flex flex-row border-dark bg-secondary items-center justify-center'
                        style={{ borderWidth: 1 }}
                        activeOpacity={1}
                        onPress={() => router.push("/categories/random")}>
                        <View className='flex-col'>
                            <Text className='text-base text-center font-elms-bold text-light mt-2' numberOfLines={1}>Random</Text>
                            <Text className='text-sm text-center font-medium mt-1 text-light'>Pop the Bubble</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
