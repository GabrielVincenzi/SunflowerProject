import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const QuestionCard = ({ title, description, image, onOpenPopup }: any) => {
    return (
        <View className="relative w-full mb-4">
            {/* 1. THE BRUTAL SHADOW LAYER 
                This view acts as the hard shadow. We position it absolutely 
                and offset it by 8px (translate-x-2 translate-y-2). */}
            <View
                className="absolute inset-0 bg-dark rounded-[40px]"
                style={{ transform: [{ translateX: 8 }, { translateY: 8 }] }}
            />

            {/* 2. THE CONTENT LAYER */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onOpenPopup}
                className="bg-white p-8 rounded-[40px] border-2 border-dark relative overflow-hidden"
            >
                {/* Decorative background element */}
                <View
                    className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full"
                    style={{ transform: [{ scale: 1.5 }] }}
                />

                <View className="flex-row items-start relative">
                    {image && (
                        <Image
                            source={{ uri: image }}
                            className="w-16 h-16 rounded-[16px] mr-5 bg-dark/5 border border-dark/10"
                            resizeMode="cover"
                        />
                    )}

                    <View className="flex-1 justify-center">
                        {/* Micro-Tag */}
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="w-2 h-2 rounded-full bg-dark opacity-20" />
                            <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.3em]">
                                Daily Synthesis
                            </Text>
                        </View>

                        {/* Title */}
                        <Text
                            className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-tight"
                            numberOfLines={2}
                        >
                            {title}
                        </Text>

                        {/* Description */}
                        {description && (
                            <Text
                                className="text-sm font-elms-regular italic text-dark/60 mt-3 leading-relaxed"
                                numberOfLines={2}
                            >
                                {description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Magazine side-accent */}
                <View className="absolute left-0 top-1/3 bottom-1/3 w-[4px] bg-primary" />
            </TouchableOpacity>
        </View>
    );
}

export default QuestionCard;