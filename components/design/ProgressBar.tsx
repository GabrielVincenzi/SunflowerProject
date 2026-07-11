import { THEME_COLORS } from '@/constants/utilities';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';


export default function ProgressBar({ value, pulse }: { value: number; pulse?: boolean }) {
    const width = useSharedValue(value);
    const boost = useSharedValue(1);
    const prev = useRef(value);

    useEffect(() => {
        if (prev.current !== value) {
            prev.current = value;
            width.value = withTiming(value, { duration: 1200, easing: Easing.out(Easing.exp) });
            boost.value = withSequence(withTiming(2.4, { duration: 420 }), withTiming(1, { duration: 210 }));
        }
    }, [value]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
        transform: [{ scaleY: boost.value }],
    }));

    return (
        <View className="flex-row items-center gap-2">
            <View className="flex-1 rounded h-1.5" style={{ backgroundColor: "rgba(52,58,64,0.1)", overflow: "visible" }}>
                <Animated.View className="h-full rounded" style={[{ backgroundColor: THEME_COLORS.secondary }, fillStyle]} />
            </View>
            <Text className="font-elms-bold text-[11px] min-w-[30px] text-right" style={{ color: "rgba(52,58,64,0.45)" }}>
                {Math.round(value)}%
            </Text>
            {pulse && <SparklePulse />}
        </View>
    );
}

function SparklePulse() {
    const s = useSharedValue(0.85);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.18, { duration: 650 }), withTiming(0.85, { duration: 650 })), -1);
    }, []);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: s.value }],
        opacity: 0.5 + (s.value - 0.85),
    }));
    return <Animated.Text className="text-sm" style={[{ color: THEME_COLORS.secondary }, style]}>✦</Animated.Text>;
}