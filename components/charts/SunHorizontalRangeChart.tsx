import { THEME_COLORS } from '@/constants/utilities';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';


export default function SunHorizontalRangeChart({
  apiData,
  screenWidth: customWidth,
  screenHeight: customHeight,
}: ChartProps) {
  const screenWidth = customWidth ?? (Dimensions.get('window').width - 32);
  const height = customHeight ?? 450;
  const paddingLeft = 120;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = screenWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extract variables (active indicators) dynamically
  const variables = useMemo(() => {
    if (!apiData || !apiData.series) return [];
    return Array.from(
      new Set(Object.keys(apiData.series).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
    );
  }, [apiData]);

  const activeGeos = apiData?.activeGeos ?? [];

  // Parse start/end values based on active variable or geographic dimensions
  const parsedChartData = useMemo(() => {
    if (!apiData || !apiData.series) return [];

    const hasMultipleVars = variables.length > 1;

    if (hasMultipleVars) {
      const targetGeo = activeGeos[0] || "";
      return variables.map((v) => {
        const key = `${v}_${targetGeo}`;
        const dataPoints = apiData.series[key] || [];
        const startVal = dataPoints[0]?.value ?? 0;
        const endVal = dataPoints[dataPoints.length - 1]?.value ?? 0;
        const customLabel = apiData.variableLabels?.[v] ?? v;

        return {
          label: customLabel,
          startValue: startVal,
          endValue: endVal,
        };
      });
    } else {
      const targetVar = variables[0] || "";
      return activeGeos.map((geo) => {
        const key = `${targetVar}_${geo}`;
        const dataPoints = apiData.series[key] || [];
        const startVal = dataPoints[0]?.value ?? 0;
        const endVal = dataPoints[dataPoints.length - 1]?.value ?? 0;

        return {
          label: geo,
          startValue: startVal,
          endValue: endVal,
        };
      });
    }
  }, [apiData, variables, activeGeos]);

  // Extract dynamic min and max boundaries for responsive horizontal axis scaling
  const values = useMemo(() => {
    if (parsedChartData.length === 0) return [0, 100];
    return parsedChartData.flatMap(d => [d.startValue, d.endValue]);
  }, [parsedChartData]);

  const minVal = useMemo(() => {
    if (values.length === 0) return 0;
    return Math.max(0, Math.min(...values) - 8);
  }, [values]);

  const maxVal = useMemo(() => {
    if (values.length === 0) return 100;
    return Math.max(minVal + 10, Math.max(...values) + 8);
  }, [values, minVal]);

  const getX = (val: number) => {
    return paddingLeft + ((val - minVal) / Math.max(maxVal - minVal, 1)) * chartWidth;
  };

  const getY = (index: number) => {
    const totalItems = parsedChartData.length;
    return paddingTop + (index / Math.max(totalItems - 1, 1)) * chartHeight;
  };

  const palette = apiData?.palette ?? [THEME_COLORS.primary, '#4F46E5', THEME_COLORS.marked];

  if (parsedChartData.length === 0) {
    return <View style={styles.emptyContainer} />;
  }

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={height}>
        {/* Dynamic vertical grid line indicators */}
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const val = minVal + (idx / 5) * (maxVal - minVal);
          const x = getX(val);
          return (
            <G key={idx}>
              <Line
                x1={x} x2={x}
                y1={paddingTop - 10} y2={paddingTop + chartHeight + 10}
                stroke={THEME_COLORS.dark} strokeWidth={1} strokeDasharray="3 3"
                opacity={0.08}
              />
              <SvgText
                x={x} y={paddingTop + chartHeight + 20}
                fontSize={9} fontWeight="bold" textAnchor="middle"
                fill={THEME_COLORS.dark}
                opacity={0.4}
              >
                {`${Math.round(val)}`}
              </SvgText>
            </G>
          );
        })}

        {/* Render Dumbbells dynamically */}
        {parsedChartData.map((row, index) => {
          const y = getY(index);
          const xStart = getX(row.startValue);
          const xEnd = getX(row.endValue);

          // Customize ending node colors from active theme palette
          const startColor = THEME_COLORS.grey;
          const endColor = palette[index % palette.length] ?? THEME_COLORS.primary;

          return (
            <G key={index}>
              {/* Row label */}
              <SvgText
                x={paddingLeft - 16} y={y + 4}
                fontSize={12} fontWeight="bold" textAnchor="end"
                fill={THEME_COLORS.dark}
              >
                {row.label.length > 12 ? `${row.label.slice(0, 12)}...` : row.label}
              </SvgText>

              {/* Muted connecter lane */}
              <Line
                x1={xStart} x2={xEnd}
                y1={y} y2={y}
                stroke={THEME_COLORS.grey} strokeWidth={2}
              />

              {/* Starting period measurement dot (Grey) */}
              <Circle
                cx={xStart} cy={y} r={12}
                fill={startColor} stroke={THEME_COLORS.dark} strokeWidth={1.5}
              />
              <SvgText
                x={xStart} y={y + 3}
                fontSize={8} fontWeight="bold" textAnchor="middle"
                fill={THEME_COLORS.dark}
              >
                {`${Math.round(row.startValue)}`}
              </SvgText>

              {/* Ending period measurement dot (Palette Color) */}
              <Circle
                cx={xEnd} cy={y} r={12}
                fill={endColor} stroke={THEME_COLORS.dark} strokeWidth={1.5}
              />
              <SvgText
                x={xEnd} y={y + 3}
                fontSize={8} fontWeight="bold" textAnchor="middle"
                fill={THEME_COLORS.dark}
              >
                {`${Math.round(row.endValue)}`}
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
    padding: 12,
    alignSelf: 'stretch',
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});