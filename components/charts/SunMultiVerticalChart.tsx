import { CHART_COLORS, THEME_COLORS } from '@/constants/utilities';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

// Shape type decider for multi-dimensional indicators (matched to Eurostat reference)
const getShapeType = (index: number) => {
    const shapes = ['diamond', 'circle', 'square', 'triangle'];
    return shapes[index % shapes.length];
};

export default function SunMultiVerticalChart({
    apiData,
    screenWidth: customWidth,
    screenHeight: customHeight,
}: ChartProps) {
    const screenWidth = customWidth ?? (Dimensions.get('window').width - 32);
    const height = customHeight ?? 420;

    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 60;

    const chartWidth = screenWidth - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Extract variables dynamically (e.g., Indicators or Years)
    const variables = useMemo(() => {
        if (!apiData || !apiData.series) return [];
        return Array.from(
            new Set(Object.keys(apiData.series).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
        );
    }, [apiData]);

    const activeGeos = apiData?.activeGeos ?? [];

    // Parse structured data dynamically representing multi-dimensional dots stacked on lanes
    const parsedChartData = useMemo(() => {
        if (!apiData || !apiData.series) return [];

        return activeGeos.map((geo) => {
            const values = variables.map((v) => {
                const key = `${v}_${geo}`;
                const dataPoints = apiData.series[key] || [];
                // Robust fallback: Always extract the first period value configuration
                const val = dataPoints[0]?.value ?? 0;
                return {
                    name: apiData.variableLabels?.[v] ?? v,
                    value: val
                };
            });
            return {
                label: geo,
                values
            };
        });
    }, [apiData, variables, activeGeos]);

    // Compute Scales and Limits
    const allValues = useMemo(() => {
        return parsedChartData.flatMap((d) => d.values.map((v) => v.value));
    }, [parsedChartData]);

    const minY = useMemo(() => {
        if (allValues.length === 0) return 0;
        return Math.max(0, Math.min(...allValues) - 5);
    }, [allValues]);

    const maxY = useMemo(() => {
        if (allValues.length === 0) return 40;
        return Math.max(20, Math.max(...allValues) + 5);
    }, [allValues]);

    const getX = (index: number) => {
        const totalItems = parsedChartData.length;
        return paddingLeft + (index / Math.max(totalItems - 1, 1)) * chartWidth;
    };

    const getY = (val: number) => {
        return paddingTop + chartHeight - ((val - minY) / Math.max(maxY - minY, 1)) * chartHeight;
    };

    // Uses selected palette parameter, API palette, or fallback to the brand utility colors
    const palette = apiData?.palette ?? CHART_COLORS;

    if (parsedChartData.length === 0) {
        return <View style={styles.emptyContainer} />;
    }

    // Render shapes helper matching high-contrast vector symbols
    const renderRNShape = (cx: number, cy: number, color: string, type: string, size = 6) => {
        const strokeProps = {
            stroke: THEME_COLORS.dark,
            strokeWidth: 1.5,
        };

        switch (type) {
            case 'diamond':
                return (
                    <Polygon
                        points={`${cx},${cy - size - 2} ${cx + size + 2},${cy} ${cx},${cy + size + 2} ${cx - size - 2},${cy}`}
                        fill={color}
                        {...strokeProps}
                    />
                );
            case 'square':
                return (
                    <Rect
                        x={cx - size}
                        y={cy - size}
                        width={2 * size}
                        height={2 * size}
                        fill={color}
                        {...strokeProps}
                    />
                );
            case 'triangle':
                return (
                    <Polygon
                        points={`${cx},${cy - size - 1} ${cx + size + 1},${cy + size + 1} ${cx - size - 1},${cy + size + 1}`}
                        fill={color}
                        {...strokeProps}
                    />
                );
            case 'circle':
            default:
                return (
                    <Circle
                        cx={cx}
                        cy={cy}
                        r={size + 1}
                        fill={color}
                        {...strokeProps}
                    />
                );
        }
    };

    return (
        <View style={styles.container}>
            <Svg width={screenWidth} height={height}>
                {/* Horizontal grid guide lines */}
                {[0, 10, 20, 30, 40].map((baseline) => {
                    if (baseline < minY || baseline > maxY) return null;
                    const y = getY(baseline);
                    return (
                        <G key={baseline}>
                            <Line
                                x1={paddingLeft - 5}
                                x2={paddingLeft + chartWidth + 5}
                                y1={y}
                                y2={y}
                                stroke={THEME_COLORS.dark}
                                strokeWidth={baseline === 0 ? 1.5 : 0.8}
                                strokeDasharray={baseline === 0 ? undefined : "3 3"}
                                opacity={0.08}
                            />
                            <SvgText
                                x={paddingLeft - 10}
                                y={y + 3}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="end"
                                fill={THEME_COLORS.dark}
                                opacity={0.4}
                            >
                                {`${baseline}`}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Lanes & Stacked Nodes */}
                {parsedChartData.map((row, index) => {
                    const x = getX(index);
                    const values = row.values.map(v => v.value);
                    if (values.length === 0) return null;

                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);

                    const yMin = getY(minVal);
                    const yMax = getY(maxVal);

                    return (
                        <G key={index}>
                            {/* Vertical connector Lane */}
                            <Line
                                x1={x}
                                x2={x}
                                y1={yMin}
                                y2={yMax}
                                stroke={THEME_COLORS.grey}
                                strokeWidth={1.5}
                            />

                            {/* Multi-level Indicators */}
                            {row.values.map((v, valIdx) => {
                                const y = getY(v.value);
                                const color = palette[valIdx % palette.length];
                                const shape = getShapeType(valIdx);

                                return (
                                    <G key={valIdx}>
                                        {renderRNShape(x, y, color, shape, 5.5)}
                                    </G>
                                );
                            })}

                            {/* Category labels rotated dynamically */}
                            <SvgText
                                x={x}
                                y={paddingTop + chartHeight + 15}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="middle"
                                fill={THEME_COLORS.dark}
                                transform={`rotate(-25 ${x} ${paddingTop + chartHeight + 15})`}
                            >
                                {row.label.length > 10 ? `${row.label.slice(0, 10)}..` : row.label}
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