import { icons } from '@/constants/icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const SunCard = ({ id, chart_id, title, description, db_name, vars, chart_type }: any) => {
    return (
        <View className="relative w-full mb-8">
            {/* Shadow Layer: Large 8px offset for primary signal cards */}
            <View
                className="absolute inset-0 bg-dark rounded-[40px]"
                style={{ transform: [{ translateX: 8 }, { translateY: 8 }] }}
            />
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                    router.push({
                        pathname: "/infos/[id]",
                        params: { id, chart_id, title, description, db: db_name, chart_type, variables: vars }
                    })
                }
                className="w-full bg-white rounded-[40px] border-2 border-dark overflow-hidden p-8"
            >
                {/* 1. Header Metadata Section */}
                <View className="flex-row justify-between items-center mb-6">
                    {/* Capsule-tag: High Impact Primary color */}
                    <View className="bg-primary px-3 py-1 rounded-full border border-dark/10">
                        <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-tight italic">
                            {db_name || 'ARCHIVE'}
                        </Text>
                    </View>
                    <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.2em]">
                        {chart_type || 'SIGNAL'}
                    </Text>
                </View>

                {/* 2. Headline: Assertive, Italic, Bold */}
                <Text
                    className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-tight"
                    numberOfLines={2}
                >
                    {title}
                </Text>

                {/* 3. Description: Light weight, Italic for contrast */}
                <Text
                    className="text-sm font-elms-regular italic text-dark/60 mt-4 leading-relaxed"
                    numberOfLines={2}
                >
                    {description || "No signal description available. System default analysis applied."}
                </Text>

                {/* 4. Footer Action */}
                <View className="mt-8 pt-6 border-t border-dark/5 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                        <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-[0.2em]">
                            Analyze Data
                        </Text>
                    </View>

                    <View className="bg-dark w-12 h-12 rounded-full items-center justify-center">
                        <Image source={icons.arrow} className="size-5 -rotate-90" tintColor="#F7CE46" />
                    </View>
                </View>

                {/* Magazine Identity Accent */}
                <View className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-primary" />
            </TouchableOpacity>
        </View>
    );
};

export default SunCard;