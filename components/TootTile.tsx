import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GrowthStage, STAGE_VISUALS, ToolDef } from './GreenhouseData';

interface ToolTileProps {
    tool: ToolDef;
    stage: GrowthStage;
    onPress: () => void;
}

export default function ToolTile({ tool, stage, onPress }: ToolTileProps) {
    const visuals = STAGE_VISUALS[stage];

    return (
        <View className="relative" style={{ width: '47%' }}>
            <View
                className="absolute inset-0 bg-dark rounded-[28px]"
                style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={onPress}
                className="bg-white border border-dark/10 rounded-[28px] p-4 justify-between"
                style={{ aspectRatio: 0.92 }}
            >
                {/* Stage badge — top-right, small, the icon language that
                    replaces any text label for seed/sprout/bloom state */}
                <View className="flex-row items-start justify-between mb-2">
                    <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#F0ECE0' }}
                    >
                        <Feather name={tool.icon} size={16} color="#5F5E5A" />
                    </View>
                    <View
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: visuals.bg }}
                    >
                        <visuals.svg width={11} height={11} stroke={visuals.tint} fill="none" />
                    </View>
                </View>

                <View>
                    <Text
                        className="text-[14.5px] font-sf-bold italic text-dark leading-snug mb-1"
                        numberOfLines={2}
                    >
                        {tool.title}
                    </Text>
                    <Text
                        className="text-[11px] font-sf-regular text-dark/45 leading-snug mb-2.5"
                        numberOfLines={2}
                    >
                        {tool.subtitle}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        <Text
                            className="text-[9.5px] font-sf-bold uppercase tracking-[0.06em]"
                            style={{ color: visuals.tint }}
                        >
                            {visuals.label}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}