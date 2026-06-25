import { CHART_COLORS, THEME_COLORS } from '@/constants/utilities';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

export default function SunVerticalRangeChart({
    apiData,
    screenWidth: customWidth,
    screenHeight: customHeight,
}: ChartProps) {
    const screenWidth = customWidth ?? (Dimensions.get('window').width - 32);
    const height = customHeight ?? 400;

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 60;

    const chartWidth = screenWidth - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Parse active series keys (extract names of active indicators)
    const variables = useMemo(() => {
        if (!apiData || !apiData.series) return [];
        return Array.from(
            new Set(Object.keys(apiData.series).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
        );
    }, [apiData]);

    const activeGeos = apiData?.activeGeos ?? [];

    // Parse data dynamically depending on dimensions of Geos or Variables
    const parsedChartData = useMemo(() => {
        if (!apiData || !apiData.series) return [];

        const hasMultipleVars = variables.length > 1;

        if (hasMultipleVars) {
            // Case A: Multiple indicators (plot variables on active column indicators, for first active Geo)
            const targetGeo = activeGeos[0] || "";
            return variables.map((v) => {
                const key = `${v}_${targetGeo}`;
                const dataPoints = apiData.series[key] || [];
                const startVal = dataPoints[0]?.value ?? 100;
                const endVal = dataPoints[dataPoints.length - 1]?.value ?? 100;
                const indexValue = startVal > 0 ? (endVal / startVal) * 100 : 100;
                const customLabel = apiData.variableLabels?.[v] ?? v;

                return {
                    label: customLabel,
                    startValue: startVal,
                    endValue: endVal,
                    indexValue,
                };
            });
        } else {
            // Case B: Single indicator across multiple geographic locations
            const targetVar = variables[0] || "";
            return activeGeos.map((geo) => {
                const key = `${targetVar}_${geo}`;
                const dataPoints = apiData.series[key] || [];
                const startVal = dataPoints[0]?.value ?? 100;
                const endVal = dataPoints[dataPoints.length - 1]?.value ?? 100;
                const indexValue = startVal > 0 ? (endVal / startVal) * 100 : 100;

                return {
                    label: geo,
                    startValue: startVal,
                    endValue: endVal,
                    indexValue,
                };
            });
        }
    }, [apiData, variables, activeGeos]);

    // Compute Scales and Boundary Guidelines dynamically
    const indices = useMemo(() => parsedChartData.map((d) => d.indexValue), [parsedChartData]);

    const minY = useMemo(() => {
        if (indices.length === 0) return 80;
        return Math.min(80, Math.min(...indices) - 8);
    }, [indices]);

    const maxY = useMemo(() => {
        if (indices.length === 0) return 120;
        return Math.max(120, Math.max(...indices) + 8);
    }, [indices]);

    const getX = (index: number) => {
        const totalItems = parsedChartData.length;
        return paddingLeft + (index / Math.max(totalItems - 1, 1)) * chartWidth;
    };

    const getY = (idxVal: number) => {
        return paddingTop + chartHeight - ((idxVal - minY) / Math.max(maxY - minY, 1)) * chartHeight;
    };

    const y100 = getY(100);

    const palette = apiData?.palette ?? CHART_COLORS;

    if (parsedChartData.length === 0) {
        return <View style={styles.emptyContainer} />;
    }

    return (
        <View style={styles.container}>
            <Svg width={screenWidth} height={height}>
                {/* Horizontal Baseline Guides */}
                {[90, 100, 110, 120].map((baseline) => {
                    if (baseline < minY || baseline > maxY) return null;
                    const y = getY(baseline);
                    const isBase = baseline === 100;

                    return (
                        <G key={baseline}>
                            <Line
                                x1={paddingLeft - 5}
                                x2={paddingLeft + chartWidth + 5}
                                y1={y}
                                y2={y}
                                stroke={THEME_COLORS.dark}
                                strokeWidth={isBase ? 1.5 : 0.8}
                                strokeDasharray={isBase ? undefined : "3 3"}
                                opacity={isBase ? 0.3 : 0.08}
                            />
                            <SvgText
                                x={paddingLeft - 10}
                                y={y + 3}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="end"
                                fill={THEME_COLORS.dark}
                            >
                                {isBase ? "100" : `${baseline}`}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Vertical Connector Lanes and Dual Node Plotting */}
                {parsedChartData.map((row, index) => {
                    const x = getX(index);
                    const yTarget = getY(row.indexValue);
                    const isUp = row.indexValue >= 100;

                    // Theme rules: palette color or fallback theme color
                    const targetColor = isUp ? (palette[index % palette.length] ?? THEME_COLORS.primary) : THEME_COLORS.marked;

                    return (
                        <G key={index}>
                            {/* Rigid Vertical Linker */}
                            <Line
                                x1={x}
                                x2={x}
                                y1={y100}
                                y2={yTarget}
                                stroke={THEME_COLORS.dark}
                                strokeWidth={1.5}
                            />

                            {/* Base Reference Starting circle */}
                            <Circle
                                cx={x}
                                cy={y100}
                                r={4.5}
                                fill={THEME_COLORS.grey}
                                stroke={THEME_COLORS.dark}
                                strokeWidth={1.2}
                            />

                            {/* Target Performance Ending Period Indicator */}
                            <Circle
                                cx={x}
                                cy={yTarget}
                                r={9}
                                fill={targetColor}
                                stroke={THEME_COLORS.dark}
                                strokeWidth={1.5}
                            />

                            {/* Relative Change +/- Numeric Notation inside Dot */}
                            <SvgText
                                x={x}
                                y={yTarget + 3}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="middle"
                                fill={isUp ? THEME_COLORS.dark : THEME_COLORS.background}
                            >
                                {isUp
                                    ? `+${Math.round(row.indexValue - 100)}`
                                    : `-${Math.round(100 - row.indexValue)}`
                                }
                            </SvgText>

                            {/* Clean Rotated Label Text */}
                            <SvgText
                                x={x}
                                y={paddingTop + chartHeight + 15}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="middle"
                                fill={THEME_COLORS.dark}
                                transform={`rotate(-25 ${x} ${paddingTop + chartHeight + 15})`}
                            >
                                {row.label.slice(0, 10) + (row.label.length > 10 ? ".." : "")}
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
        backgroundColor: THEME_COLORS.background,
        borderWidth: 2,
        borderColor: THEME_COLORS.dark,
        borderRadius: 24,
        padding: 8,
        alignSelf: 'stretch',
    },
    emptyContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
});