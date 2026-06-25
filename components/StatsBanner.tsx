import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { accuracyRatio, GreenhouseStats } from './GreenhouseData';

interface StatsBannerProps {
    stats: GreenhouseStats;
}

function StatPill({
    icon,
    value,
    label,
    accent = false,
}: {
    icon: keyof typeof Feather.glyphMap;
    value: string;
    label: string;
    accent?: boolean;
}) {
    return (
        <View
            className="flex-1 rounded-2xl p-3.5 items-center"
            style={{ backgroundColor: accent ? '#1A1A18' : '#FFFFFF', borderWidth: accent ? 0 : 1, borderColor: '#E4DFCF' }}
        >
            <View
                className="w-8 h-8 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: accent ? '#F7CE46' : '#F0ECE0' }}
            >
                <Feather name={icon} size={14} color={accent ? '#1A1A18' : '#5F5E5A'} />
            </View>
            <Text
                className="text-[19px] font-elms-bold italic mb-0.5"
                style={{ color: accent ? '#F7CE46' : '#1A1A18' }}
            >
                {value}
            </Text>
            <Text
                className="text-[9px] font-elms-bold uppercase tracking-[0.06em] text-center"
                style={{ color: accent ? '#FFFFFF80' : '#A6A398' }}
            >
                {label}
            </Text>
        </View>
    );
}

export default function StatsBanner({ stats }: StatsBannerProps) {
    const ratio = accuracyRatio(stats);

    return (
        <View className="flex-row gap-2.5 mb-2">
            <StatPill
                icon="zap"
                value={String(stats.dayStreak)}
                label="Day streak"
                accent
            />
            <StatPill
                icon="check-circle"
                value={`${ratio}%`}
                label="Accuracy"
            />
            <StatPill
                icon="sun"
                value={`${stats.toolsCompleted}/9`}
                label="Tools bloomed"
            />
        </View>
    );
}