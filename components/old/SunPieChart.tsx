import { colors } from "@/constants/utilities";
import React from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

function SunPieChart({ screenWidth, apiData }: ChartProps) {
    const safeColors = colors || ["#000000"];
    const geos = apiData.activeGeos || [];

    // Extract variables
    const variables = [
        ...new Set(Object.keys(apiData.series || {}).map((k) => k.split("_")[0])),
    ];

    let chartData: any[] = [];

    if (geos.length === 1) {
        // --- Case 1: Single Geo selected -> show all variables ---
        const geo = geos[0];
        chartData = variables.map((variable, idx) => {
            const key = `${variable}_${geo}`;
            const value = apiData.series[key]?.[0]?.value ?? 0;
            return {
                value,
                text: variable,
                color: safeColors[idx % safeColors.length],
            };
        });
    } else if (variables.length === 1) {
        // --- Case 2: Single variable selected -> show all Geos ---
        const variable = variables[0];
        chartData = geos.map((geo, idx) => {
            const key = `${variable}_${geo}`;
            const value = apiData.series[key]?.[0]?.value ?? 0;
            return {
                value,
                text: geo,
                color: safeColors[idx % safeColors.length],
            };
        });
    }

    return (
        <View className="w-full px-4 items-center">
            <PieChart
                data={chartData}
                isAnimated
                donut
                radius={120}
                textSize={12}
                showValuesAsLabels
                centerLabelComponent={() => (
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "grey" }}>
                        {geos.length === 1 ? geos[0] : variables[0]}
                    </Text>
                )}
            />

            {/* Legend */}
            <View className="flex-row flex-wrap justify-center mt-4">
                {chartData.map((d, idx) => (
                    <View
                        key={d.text}
                        className="flex-row items-center m-2"
                        style={{ gap: 6 }}
                    >
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: d.color,
                                borderRadius: 2,
                            }}
                        />
                        <Text style={{ fontSize: 12, color: "grey" }}>{d.text}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default SunPieChart;
