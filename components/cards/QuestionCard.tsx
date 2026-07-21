import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface QuestionCardProps {
    title: string;
    description?: string;
    image?: string;
    onOpenPopup: () => void;
    /** Current daily-question streak — drives the pip row. Optional; the
     * card degrades gracefully (pip row just hidden) if not provided. */
    streak?: number;
}

const QuestionCard = ({ title, description, image, onOpenPopup, streak = 0 }: QuestionCardProps) => {
    return (
        <View className="relative w-full mb-4">
            <View
                className="absolute inset-0 bg-dark rounded-[24px]"
                style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onOpenPopup}
                className="bg-white h-[200px] p-6 rounded-[24px] border-[1.5px] border-dark relative overflow-hidden justify-between"
            >
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute', top: -40, right: -40,
                        width: 150, height: 150, borderRadius: 75,
                        backgroundColor: '#F7CE46', opacity: 0.18,
                    }}
                />
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute', top: -16, right: -10,
                        width: 70, height: 70, borderRadius: 35,
                        backgroundColor: '#F7CE46', opacity: 0.26,
                    }}
                />

                {/* Yellow left accent */}
                <View className="absolute left-0 top-[14%] bottom-[14%] w-[4px] bg-primary" />

                <View className="flex-row items-start relative mb-1">
                    {image && (
                        <Image
                            source={{ uri: image }}
                            className="w-16 h-16 rounded-[16px] mr-5 bg-dark/5 border border-dark/10"
                            resizeMode="cover"
                        />
                    )}
                    <View className="flex-1 justify-center">
                        <View className="flex-row items-center gap-1.5 mb-2.5">
                            <Feather name="sun" size={11} color="#B8941F" />
                            <Text className="text-motto">
                                Today's question
                            </Text>
                        </View>

                        <Text className="text-subtitle" numberOfLines={2}>
                            {title}
                        </Text>

                        {description && (
                            <Text className="text-description" numberOfLines={2}>
                                {description}
                            </Text>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-dark/[0.06]">
                    <View className="flex-row gap-1.5">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <View
                                key={i}
                                className="w-[7px] h-[7px] rounded-full"
                                style={{
                                    backgroundColor: i < streak ? '#F7CE46' : '#E9E6DC',
                                }}
                            />
                        ))}
                    </View>
                    <Text className="text-motto">
                        {streak > 0 ? `${streak} day streak` : 'Fuel your streak'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default QuestionCard;