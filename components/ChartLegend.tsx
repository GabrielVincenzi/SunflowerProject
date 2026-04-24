import React from "react";
import { Text, View } from "react-native";

export default function ChartLegend({ items, yUnitLabel }: ChartLegendProps) {
    if (!items || items.length === 0) return null;

    return (
        <View className="items-center px-10 pt-6 pb-2">
            {/* 1. Legend Grid: High-Impact Tag Style */}
            <View className="flex-row flex-wrap justify-center gap-4">
                {items.map((item) => (
                    <View
                        key={item.label}
                        className="flex-row items-center bg-background py-3"
                    >
                        {/* Brutalist Indicator: Circular with a rigid black border */}
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: item.color,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: '#141414',
                            }}
                            className="mr-3"
                        />

                        {/* Label: Bold Italic, tight tracking, editorial uppercase */}
                        <Text className="text-sm font-elms-bold italic text-dark tracking-[0.15em] leading-none">
                            {item.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* 2. Systematic Unit Indicator: Technical readout style */}
            {yUnitLabel ? (
                <View className="mt-10 flex-row items-center gap-4">
                    <View className="h-[1px] w-8 bg-dark/10" />
                    <Text className="text-[9px] font-elms-bold text-dark/20 uppercase tracking-[0.5em]">
                        SIGNAL_DOMAIN // {yUnitLabel.toUpperCase()}
                    </Text>
                    <View className="h-[1px] w-8 bg-dark/10" />
                </View>
            ) : null}
        </View>
    );
}