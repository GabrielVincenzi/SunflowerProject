import { animationDuration, CHART_COLORS, THEME_COLORS } from '@/constants/utilities';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import ChartLegend from '../chartscomp/ChartLegend';

const AnimatedLine = Animated.createAnimatedComponent(SvgLine);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(SvgText);

// ─── Connector — the "change" itself, drawn growing from start to
// end. Same idea as the line chart's path draw, just a straight
// segment instead of a curve.
function AnimatedConnector({
  xStart, xEnd, y, delay,
}: { xStart: number; xEnd: number; y: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    x2: xStart + (xEnd - xStart) * progress.value,
  }));

  return (
    <AnimatedLine
      x1={xStart}
      y1={y}
      y2={y}
      stroke={THEME_COLORS.grey}
      strokeWidth={2}
      animatedProps={animatedProps}
    />
  );
}

// ─── Start point — the reference value. Appears with a quick fade,
// like static chrome settling into place before the change animates.
function StartPoint({
  x, y, value, delay,
}: { x: number; y: number; value: number; delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }));
  }, []);

  const circleProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  const textProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <G>
      <AnimatedCircle cx={x} cy={y} r={13} fill={THEME_COLORS.grey} animatedProps={circleProps} />
      <AnimatedText
        x={x}
        y={y + 4}
        fontSize={11}
        fontStyle="italic"
        textAnchor="middle"
        fill={THEME_COLORS.background}
        animatedProps={textProps}
      >
        {`${Math.round(value)}`}
      </AnimatedText>
    </G>
  );
}

// ─── End point — the featured value. Pops in with a spring-overshoot
// after the connector finishes drawing, exactly like SunLineChart's
// end-of-line marker: filled dot + cream punch-out ring.
function EndPoint({
  x, y, value, color, delay,
}: { x: number; y: number; value: number; color: string; delay: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(delay, withTiming(1, { duration: 340, easing: Easing.out(Easing.back(1.6)) }));
  }, []);

  const ringProps = useAnimatedProps(() => ({ opacity: opacity.value, r: 17 * scale.value }));
  const dotProps = useAnimatedProps(() => ({ opacity: opacity.value, r: 13 * scale.value }));
  const textProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <G>
      <AnimatedCircle cx={x} cy={y} fill={THEME_COLORS.background} animatedProps={ringProps} />
      <AnimatedCircle cx={x} cy={y} fill={color} animatedProps={dotProps} />
      <AnimatedText
        x={x}
        y={y + 4}
        fontSize={11}
        fontStyle="italic"
        textAnchor="middle"
        fill={THEME_COLORS.background}
        animatedProps={textProps}
      >
        {`${Math.round(value)}`}
      </AnimatedText>
    </G>
  );
}

// ─── SunHorizontalRangeChart ────────────────────────────────────
// Full-width, card-free — matches the shared SunChartProps contract.
// yDomainOverride, when present, is used exactly as given (no auto
// padding), same invariant as every other chart in the registry:
// an explicit override is a deliberate manipulation and must not be
// silently adjusted.
export default function SunHorizontalRangeChart({
  apiData,
  screenWidth: customWidth,
  height = 280,
  xTickCount,
  yTickCount = 5,
  yDomainOverride,
}: ChartProps) {
  const screenWidth = customWidth ?? (Dimensions.get('window').width - 32);
  const paddingLeft = 120;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const minRowHeight = 48;

  const chartWidth = screenWidth - paddingLeft - paddingRight;

  const variables = useMemo(() => {
    if (!apiData || !apiData.series) return [];
    return Array.from(
      new Set(Object.keys(apiData.series).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
    );
  }, [apiData]);

  const activeGeos = apiData?.activeGeos ?? [];

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

        return { label: customLabel, startValue: startVal, endValue: endVal };
      });
    } else {
      const targetVar = variables[0] || "";
      return activeGeos.map((geo) => {
        const key = `${targetVar}_${geo}`;
        const dataPoints = apiData.series[key] || [];
        const startVal = dataPoints[0]?.value ?? 0;
        const endVal = dataPoints[dataPoints.length - 1]?.value ?? 0;

        return { label: geo, startValue: startVal, endValue: endVal };
      });
    }
  }, [apiData, variables, activeGeos]);

  const chartHeightTotal = Math.max(height, parsedChartData.length * minRowHeight + paddingTop + paddingBottom);
  const chartHeight = chartHeightTotal - paddingTop - paddingBottom;

  const values = useMemo(() => {
    if (parsedChartData.length === 0) return [0, 100];
    return parsedChartData.flatMap(d => [d.startValue, d.endValue]);
  }, [parsedChartData]);

  // Skip the auto ± padding when an explicit domain override is given —
  // an override is a deliberate manipulation and must be respected exactly.
  const minVal = useMemo(() => {
    if (yDomainOverride?.yMin !== undefined) return yDomainOverride.yMin;
    if (values.length === 0) return 0;
    return Math.max(0, Math.min(...values) - 8);
  }, [values, yDomainOverride]);

  const maxVal = useMemo(() => {
    if (yDomainOverride?.yMax !== undefined) return yDomainOverride.yMax;
    if (values.length === 0) return 100;
    return Math.max(minVal + 10, Math.max(...values) + 8);
  }, [values, minVal, yDomainOverride]);

  const getX = (val: number) => {
    return paddingLeft + ((val - minVal) / Math.max(maxVal - minVal, 1)) * chartWidth;
  };

  const getY = (index: number) => {
    const totalItems = parsedChartData.length;
    return paddingTop + (index / Math.max(totalItems - 1, 1)) * chartHeight;
  };

  const palette = apiData?.palette ?? CHART_COLORS;

  const legendItems = useMemo(() => ([
    { label: 'Start', color: THEME_COLORS.grey },
    { label: 'End', color: palette[0] },
  ]), [palette]);

  if (parsedChartData.length === 0) {
    return <View className="h-[150px] items-center justify-center" />;
  }

  const gridSteps = Math.max(yTickCount, 1);

  return (
    // No card, no border, no radius, no background of its own.
    <View className="w-full">
      <ChartLegend items={legendItems} />

      <Svg width={screenWidth} height={chartHeightTotal}>
        {/* Value-axis gridlines — recessive, dashed */}
        {Array.from({ length: gridSteps + 1 }).map((_, idx) => {
          const val = minVal + (idx / gridSteps) * (maxVal - minVal);
          const x = getX(val);
          return (
            <G key={idx}>
              <SvgLine
                x1={x} x2={x}
                y1={paddingTop - 10} y2={paddingTop + chartHeight + 10}
                stroke={THEME_COLORS.subtle} strokeWidth={1} strokeDasharray="4,5"
              />
              <SvgText
                x={x} y={paddingTop + chartHeight + 20}
                fontSize={11} fontStyle="italic" textAnchor="middle"
                fill={THEME_COLORS.grey}
              >
                {`${Math.round(val)}`}
              </SvgText>
            </G>
          );
        })}

        {/* Rows */}
        {parsedChartData.map((row, index) => {
          const y = getY(index);
          const xStart = getX(row.startValue);
          const xEnd = getX(row.endValue);
          const endColor = palette[index % palette.length];
          const rowDelay = index * 80;

          return (
            <G key={index}>
              {/* Category label — muted supporting text, no axis line, no tick marks */}
              <SvgText
                x={paddingLeft - 16} y={y + 4}
                fontSize={11} fontStyle="italic" textAnchor="end"
                fill={THEME_COLORS.grey}
              >
                {row.label.length > 12 ? `${row.label.slice(0, 12)}...` : row.label}
              </SvgText>

              <AnimatedConnector xStart={xStart} xEnd={xEnd} y={y} delay={rowDelay} />
              <StartPoint x={xStart} y={y} value={row.startValue} delay={rowDelay} />
              <EndPoint
                x={xEnd}
                y={y}
                value={row.endValue}
                color={endColor}
                delay={rowDelay + 150 + animationDuration}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}