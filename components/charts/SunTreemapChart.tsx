import { THEME_COLORS } from "@/constants/utilities";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, Rect, RectProps, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedTile({ x, y, w, h, fill, delay }: any) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 600 }));
    }, []);

    const animatedProps = useAnimatedProps<RectProps>(() => ({
        width: w * progress.value,
        height: h * progress.value,
        opacity: progress.value,
    }));

    return <AnimatedRect x={x} y={y} fill={fill} stroke={THEME_COLORS.dark} strokeWidth={2} animatedProps={animatedProps} />;
}

const SunTreemapChart = ({ screenWidth, apiData }: any) => {
    const width = screenWidth - 32;
    const height = 300;
    const geos = apiData.activeGeos || [];
    const variables = useMemo(() => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf('_'))))), [apiData]);

    const treeData = useMemo(() => ({
        name: "root",
        children: geos.map((geo: string) => ({
            name: geo,
            children: variables.map((v) => ({
                name: v,
                value: Math.abs(apiData.series[`${v}_${geo}`]?.[0]?.value ?? 0)
            }))
        }))
    }), [geos, variables, apiData]);

    const leaves = useMemo(() => {
        const root = hierarchy(treeData).sum((d: any) => d.value).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        treemap<any>().size([width, height]).tile(treemapSquarify).padding(2)(root);
        return root.leaves();
    }, [treeData, width]);

    return (
        <View style={{ backgroundColor: THEME_COLORS.background, padding: 16, borderLeftWidth: 8, borderColor: THEME_COLORS.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: THEME_COLORS.primary, fontWeight: '900', fontStyle: 'italic', fontSize: 10 }}>TREEMAP // HIERARCHY_NODES</Text>
            </View>
            <Svg width={width} height={height}>
                {leaves.map((node: any, i) => (
                    <G key={i}>
                        <AnimatedTile
                            x={node.x0} y={node.y0} w={node.x1 - node.x0} h={node.y1 - node.y0}
                            fill={i % 2 === 0 ? THEME_COLORS.primary : THEME_COLORS.background}
                            delay={i * 40}
                        />
                        {(node.x1 - node.x0) > 50 && (
                            <SvgText x={node.x0 + 6} y={node.y0 + 18} fontSize={9} fontWeight="900" fontStyle="italic" fill={THEME_COLORS.dark}>
                                {node.data.name.toUpperCase()}
                            </SvgText>
                        )}
                    </G>
                ))}
            </Svg>
        </View>
    );
};

export default SunTreemapChart;