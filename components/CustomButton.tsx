import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

function CustomButton({ onPress, title, IconLeft, IconRight, classname, textClassname, ...props }: ButtonProps) {
    return (
        <View className="relative w-full mb-6">
            {/* 1. Hard Brutalist Shadow */}
            <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5" />

            {/* 2. Content Layer */}
            <TouchableOpacity
                activeOpacity={0.9}
                className={`w-full rounded-[32px] border-2 border-dark flex flex-row justify-center items-center py-5 px-6 bg-white ${classname}`}
                onPress={onPress}
                {...props}>
                {IconLeft && <View className="mr-3"><IconLeft /></View>}
                <Text className={`text-2xl font-elms-bold italic tracking-tighter text-dark leading-none ${textClassname}`}>
                    {title}
                </Text>
                {IconRight && <View className="ml-3"><IconRight /></View>}
            </TouchableOpacity>
        </View>
    )
}

export default CustomButton;