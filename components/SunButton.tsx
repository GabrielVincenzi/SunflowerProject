import { icons } from '@/constants/icons'
import { router } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity } from 'react-native'

function SunButton({ text }: { text: string }) {
    return (
        <TouchableOpacity
            className="absolute bottom-6 left-6 right-6 bg-secondary rounded-2xl py-4 flex-row items-center justify-center"
            onPress={() => router.back()}
            activeOpacity={0.85}
        >
            <Image source={icons.arrow} className="size-5 mr-2 rotate-180" tintColor="#fff" />
            <Text className="text-white font-semibold text-base">{text}</Text>
        </TouchableOpacity>
    )
}

export default SunButton