import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
    label: string;
    startValue: number;
    endValue: number;
}

interface IndexChartProps {
    data?: DataPoint[];
}

export default function SunVerticalRangeChart({
    data = [
        { label: "Customer 10", startValue: 86, endValue: 91 },
        { label: "Customer 8", startValue: 85, endValue: 90 },
        { label: "Customer 1", startValue: 81, endValue: 72 },
        { label: "Customer 7", startValue: 80, endValue: 89 },
        { label: "Customer 3", startValue: 80, endValue: 83 },
        { label: "Customer 9", startValue: 78, endValue: 84 },
        { label: "Customer 4", startValue: 77, endValue: 81 },
        { label: "Customer 2", startValue: 76, endValue: 87 },
        { label: "Customer 5", startValue: 72, endValue: 77 },
        { label: "Customer 6", startValue: 71, endValue: 78 },
    ],
}: IndexChartProps) {
    const screenWidth = Dimensions.get('window').width - 32;
    const height = 400;

    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 30;
    const paddingBottom = 60;

    const chartWidth = screenWidth - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const chartData = useMemo(() => {
        return data.map(item => {
            const idx = item.startValue > 0 ? (item.endValue / item.startValue) * 100 : 100;
            return { ...item, indexValue: idx };
        });
    }, [data]);

    const indices = chartData.map(d => d.indexValue);
    const minY = Math.min(80, Math.min(...indices) - 5);
    const maxY = Math.max(120, Math.max(...indices) + 5);

    const getX = (index: number) => {
        return paddingLeft + (index / Math.max(data.length - 1, 1)) * chartWidth;
    };

    const getY = (idxVal: number) => {
        return paddingTop + chartHeight - ((idxVal - minY) / (maxY - minY)) * chartHeight;
    };

    const y100 = getY(100);

    return (
        <View style={styles.container}>
            <Svg width={screenWidth} height={height}>
                {/* Benchmarks horizontals */}
                {[90, 100, 110, 120].map((baseline) => {
                    if (baseline < minY || baseline > maxY) return null;
                    const y = getY(baseline);
                    const isBase = baseline === 100;
                    return (
                        <G key={baseline}>
                            <Line
                                x1={paddingLeft - 5} x2={paddingLeft + chartWidth + 5}
                                y1={y} y2={y}
                                stroke="#141414"
                                strokeWidth={isBase ? 1.5 : 0.8}
                                strokeDasharray={isBase ? undefined : "3 3"}
                                opacity={isBase ? 0.3 : 0.08}
                            />
                            <SvgText
                                x={paddingLeft - 10} y={y + 3}
                                fontSize={8} fontWeight="bold" textAnchor="end"
                                fill="#141414"
                            >
                                {isBase ? "100" : `${baseline}`}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Lanes */}
                {chartData.map((row, index) => {
                    const x = getX(index);
                    const yTarget = getY(row.indexValue);
                    const isUp = row.indexValue >= 100;

                    const targetColor = isUp ? "#F7CE46" : "#4F46E5";

                    return (
                        <G key={index}>
                            {/* Connector */}
                            <Line
                                x1={x} x2={x}
                                y1={y100} y2={yTarget}
                                stroke="#141414" strokeWidth={1.5}
                            />

                            {/* Start Dot (at 100 base) */}
                            <Circle
                                cx={x} cy={y100} r={5}
                                fill="#A3A3A3" stroke="#141414" strokeWidth={1}
                            />

                            {/* Target Dot */}
                            <Circle
                                cx={x} cy={yTarget} r={10}
                                fill={targetColor} stroke="#141414" strokeWidth={1.5}
                            />
                            <SvgText
                                x={x} y={yTarget + 3}
                                fontSize={8} fontWeight="black" textAnchor="middle"
                                fill="#FFFFFF"
                            >
                                {isUp ? `+${Math.round(row.indexValue - 100)}` : `-${Math.round(100 - row.indexValue)}`}
                            </SvgText>

                            {/* Item label */}
                            <SvgText
                                x={x} y={paddingTop + chartHeight + 15}
                                fontSize={8} fontWeight="bold" textAnchor="middle"
                                fill="#141414"
                                transform={`rotate(-25 ${x} ${paddingTop + chartHeight + 15})`}
                            >
                                {row.label.split(' ')[1] || row.label}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FDFCF6',
        borderWidth: 2,
        borderColor: '#141414',
        borderRadius: 8,
        padding: 8,
        alignSelf: 'stretch',
    },
});