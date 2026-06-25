import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type FeedMode = 'recommended' | 'random';

interface ModeSwitchProps {
    mode: FeedMode;
    onChange: (mode: FeedMode) => void;
}

export default function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
    return (
        <View className="flex-row gap-2 mb-5">
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onChange('recommended')}
                className={`flex-1 py-2.5 rounded-[18px] items-center ${
                    mode === 'recommended' ? 'bg-dark' : 'bg-white border border-dark/10'
                }`}
            >
                <Text
                    className={`text-xs font-elms-bold ${
                        mode === 'recommended' ? 'text-primary' : 'text-dark/50'
                    }`}
                >
                    For you
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onChange('random')}
                className={`flex-1 py-2.5 rounded-[18px] items-center ${
                    mode === 'random' ? 'bg-dark' : 'bg-white border border-dark/10'
                }`}
            >
                <Text
                    className={`text-xs font-elms-bold ${
                        mode === 'random' ? 'text-primary' : 'text-dark/50'
                    }`}
                >
                    Surprise me
                </Text>
            </TouchableOpacity>
        </View>
    );
}
