import { icons } from '@/constants/icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const CategoryCard = ({ category, index }: { category: string; index: number }) => {
    const displayIndex = (index + 1).toString().padStart(2, '0');

    return (
        <View className="relative w-full mb-5">
            {/* 1. Shadow Layer: 6px offset for category list items */}
            <View
                className="absolute inset-0 bg-dark rounded-[24px]"
                style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
            />
            {/* 2. Content Layer */}
            <TouchableOpacity
                activeOpacity={0.9}
                className="w-full bg-white rounded-[24px] border-2 border-dark overflow-hidden flex-row items-center p-5"
                onPress={() =>
                    router.push({
                        pathname: "/categories/[cat]",
                        params: { cat: category }
                    })
                }>
                {/* Index: Low opacity bold italic */}
                <Text className="text-sm font-elms-bold italic text-dark/30 mr-5">
                    {displayIndex}
                </Text>

                <View className="flex-1">
                    {/* Category Title: Bold Italic with tight tracking */}
                    <Text className="text-2xl font-elms-bold text-dark italic tracking-tighter leading-tight">
                        {category
                            .split("-")
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                    </Text>
                </View>

                {/* Minimalist Arrow: Rigid Dark Circle */}
                <View className="bg-dark w-10 h-10 rounded-full items-center justify-center">
                    <Image source={icons.arrow} className="size-5 rotate-180" tintColor="white" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default CategoryCard;