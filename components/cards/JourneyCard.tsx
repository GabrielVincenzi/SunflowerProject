import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface JourneyCardProps {
    /** 0-9, how many of the 9 tools have been bloomed so far */
    toolsCompleted: number;
    onPress: () => void;
}

export default function JourneyCard({ toolsCompleted, onPress }: JourneyCardProps) {
    const progressPct = Math.round((toolsCompleted / 9) * 100);
    const started = toolsCompleted > 0;

    return (
        <View className="relative w-full mb-7">
            <View
                className="absolute inset-0 bg-dark rounded-[36px]"
                style={{ transform: [{ translateX: 7 }, { translateY: 7 }] }}
            />
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={onPress}
                className="bg-dark rounded-[36px] p-7 overflow-hidden"
            >
                {/* Layered sun glow — the featured-emphasis device, doubled
                    since this is the single largest commitment in the
                    Greenhouse (all 9 tools strung together) */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute', top: -44, right: -36,
                        width: 160, height: 160, borderRadius: 80,
                        backgroundColor: '#F7CE46', opacity: 0.15,
                    }}
                />
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute', top: -18, right: -8,
                        width: 76, height: 76, borderRadius: 38,
                        backgroundColor: '#F7CE46', opacity: 0.22,
                    }}
                />

                <View className="flex-row items-center gap-2 mb-3">
                    <Feather name="map" size={13} color="#F7CE46" />
                    <Text className="text-[11px] font-elms-bold uppercase tracking-[0.15em] text-primary/75">
                        The Journey
                    </Text>
                </View>

                <Text className="text-[22px] font-elms-bold italic text-white leading-snug mb-2">
                    All nine tools, one guided path
                </Text>
                <Text className="text-[13px] font-elms-regular text-white/55 leading-relaxed mb-5">
                    A single thread through everything in the greenhouse — from your first
                    bent chart to your last calibrated guess.
                </Text>

                {/* Progress bar — the journey's own dedicated progress
                    indicator, distinct from any single tool's stage icon */}
                <View className="mb-4">
                    <View className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                        <View
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(progressPct, started ? 4 : 0)}%` }}
                        />
                    </View>
                    <Text className="text-[10px] font-elms-bold text-white/40 uppercase tracking-[0.08em]">
                        {toolsCompleted} of 9 tools bloomed
                    </Text>
                </View>

                <View className="self-start bg-primary px-5 py-2.5 rounded-full flex-row items-center gap-2">
                    <Text className="text-[11px] font-elms-bold text-dark uppercase tracking-[0.08em]">
                        {started ? 'Continue the journey' : 'Begin the journey'}
                    </Text>
                    <Feather name="arrow-up-right" size={12} color="#1A1A18" />
                </View>
            </TouchableOpacity>
        </View>
    );
}