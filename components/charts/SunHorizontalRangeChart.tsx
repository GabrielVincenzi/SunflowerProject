import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  label: string;
  startValue: number;
  endValue: number;
}

interface DumbbellChartProps {
  data?: DataPoint[];
  threshold?: number;
}

export default function SunHorizontalRangeChart({
  data = [
    { label: "Customer 10", startValue: 86, endValue: 91 },
    { label: "Customer 8", startValue: 85, endValue: 90 },
    { label: "Customer 1", startValue: 81, endValue: 72 }, // Drops below 75
    { label: "Customer 7", startValue: 80, endValue: 89 },
    { label: "Customer 3", startValue: 80, endValue: 83 },
    { label: "Customer 9", startValue: 78, endValue: 84 },
    { label: "Customer 4", startValue: 77, endValue: 81 },
    { label: "Customer 2", startValue: 76, endValue: 87 },
    { label: "Customer 5", startValue: 72, endValue: 77 },
    { label: "Customer 6", startValue: 71, endValue: 78 },
  ],
  threshold = 75,
}: DumbbellChartProps) {
  const screenWidth = Dimensions.get('window').width - 32;
  const height = 450;
  const paddingLeft = 110;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 30;

  const chartWidth = screenWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.flatMap(d => [d.startValue, d.endValue]);
  const minVal = Math.max(0, Math.min(...values) - 8);
  const maxVal = Math.min(100, Math.max(...values) + 8);

  const getX = (val: number) => {
    return paddingLeft + ((val - minVal) / (maxVal - minVal)) * chartWidth;
  };

  const getY = (index: number) => {
    return paddingTop + (index / Math.max(data.length - 1, 1)) * chartHeight;
  };

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={height}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const val = minVal + (idx / 5) * (maxVal - minVal);
          const x = getX(val);
          return (
            <G key={idx}>
              <Line
                x1={x} x2={x}
                y1={paddingTop - 10} y2={paddingTop + chartHeight + 10}
                stroke="#141414" strokeWidth={1} strokeDasharray="3 3"
                opacity={0.08}
              />
              <SvgText
                x={x} y={paddingTop + chartHeight + 20}
                fontSize={9} fontWeight="bold" textAnchor="middle"
                fill="rgba(20, 20, 20, 0.4)"
              >
                {`${Math.round(val)}%`}
              </SvgText>
            </G>
          );
        })}

        {/* Threshold line */}
        {threshold >= minVal && threshold <= maxVal && (
          <G>
            <Line
              x1={getX(threshold)} x2={getX(threshold)}
              y1={paddingTop - 15} y2={paddingTop + chartHeight + 15}
              stroke="#141414" strokeWidth={1.5} strokeDasharray="4 4"
            />
            <SvgText
              x={getX(threshold) - 6} y={paddingTop - 10}
              fontSize={9} fontWeight="bold" textAnchor="end"
              fill="#141414"
            >
              {`Usage at ${threshold}%`}
            </SvgText>
          </G>
        )}

        {/* Dumbbells */}
        {data.map((row, index) => {
          const y = getY(index);
          const xStart = getX(row.startValue);
          const xEnd = getX(row.endValue);

          const isDropped = row.endValue < threshold;
          const startColor = "#A3A3A3";
          const endColor = isDropped ? "#F7CE46" : "#4F46E5";

          return (
            <G key={index}>
              {/* Row label */}
              <SvgText
                x={paddingLeft - 16} y={y + 4}
                fontSize={12} fontWeight="bold" textAnchor="end"
                fill="#141414"
              >
                {row.label}
              </SvgText>

              {/* Lane connector */}
              <Line
                x1={xStart} x2={xEnd}
                y1={y} y2={y}
                stroke="#CCCCCC" strokeWidth={2}
              />

              {/* Start Dot */}
              <Circle
                cx={xStart} cy={y} r={12}
                fill={startColor} stroke="#141414" strokeWidth={1.5}
              />
              <SvgText
                x={xStart} y={y + 3.5}
                fontSize={9} fontWeight="bold" textAnchor="middle"
                fill="#FFFFFF"
              >
                {row.startValue}
              </SvgText>

              {/* End Dot (Static, no hover triggers) */}
              <Circle
                cx={xEnd} cy={y} r={12}
                fill={endColor} stroke="#141414" strokeWidth={1.5}
              />
              <SvgText
                x={xEnd} y={y + 3.5}
                fontSize={9} fontWeight="bold" textAnchor="middle"
                fill="#FFFFFF"
              >
                {row.endValue}
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
    padding: 12,
    alignSelf: 'stretch',
  },
});