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
                className="absolute inset-0 bg-dark rounded-[40px]"
                style={{ transform: [{ translateX: 8 }, { translateY: 8 }] }}
            />

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onOpenPopup}
                className="bg-white p-7 rounded-[40px] border-[1.5px] border-dark relative overflow-hidden"
            >
                {/* Sunflower glow — the same featured-emphasis device used on
                    SunCard, but doubled here (two layered circles) since
                    this is the single most recurring ritual in the app and
                    deserves the strongest pull of the "turn towards the
                    light" motif. */}
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
                        {/* Micro-tag — sun icon instead of a plain dot, the
                            small unique identifier of this card vs every
                            other featured card in the app */}
                        <View className="flex-row items-center gap-1.5 mb-2.5">
                            <Feather name="sun" size={11} color="#B8941F" />
                            <Text className="text-[10px] font-elms-bold text-dark/45 uppercase tracking-[0.22em]">
                                Today's question
                            </Text>
                        </View>

                        <Text
                            className="text-[26px] font-elms-bold italic text-dark tracking-tight leading-[30px]"
                            numberOfLines={2}
                        >
                            {title}
                        </Text>

                        {description && (
                            <Text
                                className="text-[13px] font-elms-regular text-dark/55 mt-2.5 leading-relaxed"
                                numberOfLines={2}
                            >
                                {description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Streak pip row — the unique daily-ritual identity. Reads
                    "you've shown up N days running" at a glance, distinct
                    from any other card on the home screen. Degrades
                    gracefully: if streak is 0, shows an inviting empty row
                    instead of disappearing, so first-time users still see
                    the mechanic exists. */}
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
                    <Text className="text-[10px] font-elms-bold text-dark/35 uppercase tracking-[0.1em]">
                        {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default QuestionCard;