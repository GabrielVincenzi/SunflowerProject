import { icons } from '@/constants/icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const SunSavedCard = ({ data: { id, title, description, db_name, vars, chart_type, chart_id }, savedAt }: any) => {
    const formattedDate = savedAt ? new Date(savedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : 'RECENTLY ARCHIVED';

    return (
        <View className="relative w-full mb-8">
            {/* Shadow Layer: Bold 8px offset */}
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
                {/* 1. Archival Metadata Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center gap-2">
                        {/* Source Tag */}
                        <View className="bg-accent/20 border border-accent/40 px-3 py-1 rounded-full">
                            <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-tight">
                                {db_name || 'ARCHIVE'}
                            </Text>
                        </View>
                        {/* High-Contrast "Saved" Indicator */}
                        <View className="bg-dark px-3 py-1 rounded-full">
                            <Text className="text-[10px] font-elms-bold text-accent italic uppercase tracking-widest">
                                SAVED
                            </Text>
                        </View>
                    </View>

                    <Text className="text-[10px] font-elms-bold text-dark/30 uppercase tracking-[0.2em]">
                        {formattedDate}
                    </Text>
                </View>

                {/* 2. Headline & Description */}
                <Text
                    className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-tight"
                    numberOfLines={2}
                >
                    {title}
                </Text>

                <Text
                    className="text-sm font-elms-regular italic text-dark/70 mt-4 leading-relaxed"
                    numberOfLines={2}
                >
                    {description || "No signal description available for this archive entry."}
                </Text>

                {/* 3. Review Action Footer */}
                <View className="mt-8 pt-6 border-t border-dark/10 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2" />
                        <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-[0.25em]">
                            Review Signal
                        </Text>
                    </View>

                    <View className="bg-dark w-12 h-12 rounded-full items-center justify-center">
                        <Image source={icons.arrow} className="size-5 -rotate-90" tintColor="white" />
                    </View>
                </View>

                {/* Branding Accent */}
                <View className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-accent" />
            </TouchableOpacity>
        </View>
    );
};

export default SunSavedCard;