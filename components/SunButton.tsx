import React, { useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';

const SunButton = ({ text, onPress, className, disabled }: SunButtonProps) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }} className="relative w-full px-4">
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                disabled={disabled}
                className={`${disabled ? "bg-dark/10 opacity-50" : "bg-dark"} border-2 border-white flex-row items-center justify-center py-4 px-4 rounded-[32px] ${className}`}
            >
                <Text className={`font-elms-bold italic uppercase tracking-[0.25em] text-center ${disabled ? "text-dark/40" : "text-primary text-md"}`}>
                    {text}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default SunButton;