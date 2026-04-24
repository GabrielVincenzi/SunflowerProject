import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function HomeHeader({
    userName,
    logo,
    onLogoPress = () => { },
    onNotifPress = () => { },
}: HomeHeaderProps) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <View className="w-full pt-4 pb-2 bg-transparent">
            <View className="flex-row items-center justify-between">
                {/* 1. IDENTITY SECTION */}
                <View className="flex-row items-center flex-1 gap-5">
                    {/* Logo Block: High-contrast Dark background with high radius */}
                    <TouchableOpacity
                        onPress={onLogoPress}
                        activeOpacity={0.85}
                        className="w-14 h-14 bg-white rounded-[20px] items-center justify-center"
                    >
                        <Image source={logo} className="w-10 h-10" resizeMode="contain" />
                    </TouchableOpacity>

                    <View className="flex-shrink">
                        {/* Greeting: Bold Italic with tight tracking for editorial impact */}
                        <Text
                            className="text-2xl font-elms-bold text-dark tracking-tighter italic leading-none"
                            numberOfLines={2}
                        >
                            {timeGreeting}{userName ? `, ${userName}` : '!'}
                        </Text>
                    </View>
                </View>

                {/* 2. ACTIONS SECTION: Brutalist Notification Button */}
                <View className="relative">
                    {/* Shadow Layer: 4px offset for a tighter button feel */}
                    <View
                        className="absolute inset-0 bg-dark rounded-2xl"
                        style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
                    />
                    {/* Floating Layer: White background with a rigid border */}
                    <TouchableOpacity
                        onPress={onNotifPress}
                        activeOpacity={0.75}
                        className="w-12 h-12 items-center justify-center rounded-2xl border-2 border-dark bg-white"
                    >
                        <Feather name="bell" size={20} color="#141414" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}