import { THEME_COLORS } from "@/constants/utilities";
import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, StyleProp, Text, View, ViewStyle } from 'react-native';
import {
    Gesture,
    GestureDetector
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';


const ACCENT_MAP = {
    primary: { thumb: THEME_COLORS.primary, fill: THEME_COLORS.dark, thumbBorder: THEME_COLORS.dark },
    dark: { thumb: THEME_COLORS.dark, fill: THEME_COLORS.dark, thumbBorder: THEME_COLORS.background },
    green: { thumb: THEME_COLORS.marked, fill: THEME_COLORS.marked, thumbBorder: THEME_COLORS.background },
    error: { thumb: THEME_COLORS.error, fill: THEME_COLORS.error, thumbBorder: THEME_COLORS.background },
};

// ─── Props ────────────────────────────────────────────────────
export interface SunSliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    label?: string;
    unit?: string;
    formatValue?: (v: number) => string;
    onChange?: (v: number) => void;
    onChangeEnd?: (v: number) => void;
    accent?: keyof typeof ACCENT_MAP;
    trackHeight?: number;
    thumbSize?: number;
    showValue?: boolean;
    showMinMax?: boolean;
    fillStyle?: 'filled' | 'none';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    // Optional: constrained — show remaining budget (e.g. area budget)
    budgetLabel?: string;
    budgetValue?: number;
    budgetWarning?: boolean;
}

// ─── Component ────────────────────────────────────────────────
export function SunSlider({
    value,
    min,
    max,
    step = 1,
    label,
    unit,
    formatValue,
    onChange,
    onChangeEnd,
    accent = 'primary',
    trackHeight = 4,
    thumbSize = 26,
    showValue = true,
    showMinMax = false,
    fillStyle = 'filled',
    disabled = false,
    style,
    budgetLabel,
    budgetValue,
    budgetWarning = false,
}: SunSliderProps) {
    const colors = ACCENT_MAP[accent];
    const trackW = useSharedValue(0);
    const thumbX = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const displayVal = useSharedValue(value);

    // Snap helper (pure, runs on UI thread)
    const snap = (raw: number): number => {
        'worklet';
        if (step <= 0) return raw;
        return Math.round(raw / step) * step;
    };

    // Clamp helper
    const clamp = (v: number, lo: number, hi: number): number => {
        'worklet';
        return Math.max(lo, Math.min(hi, v));
    };

    // Convert value → x position
    const valToX = (v: number, tW: number): number => {
        'worklet';
        if (tW <= 0) return 0;
        return ((v - min) / (max - min)) * (tW - thumbSize);
    };

    // Convert x position → value
    const xToVal = (x: number, tW: number): number => {
        'worklet';
        const ratio = clamp(x / (tW - thumbSize), 0, 1);
        return snap(min + ratio * (max - min));
    };

    // Sync thumbX when value prop changes externally
    useEffect(() => {
        if (trackW.value > 0) {
            thumbX.value = valToX(value, trackW.value);
        }
        displayVal.value = value;
    }, [value]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        trackW.value = w;
        thumbX.value = valToX(value, w);
    }, [value]);

    // Pan gesture — all on UI thread
    const startX = useSharedValue(0);

    const pan = Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
            'worklet';
            startX.value = thumbX.value;
            isDragging.value = true;
        })
        .onUpdate(e => {
            'worklet';
            const raw = clamp(startX.value + e.translationX, 0, trackW.value - thumbSize);
            thumbX.value = raw;
            const v = xToVal(raw, trackW.value);
            displayVal.value = v;
            if (onChange) runOnJS(onChange)(v);
        })
        .onEnd(() => {
            'worklet';
            isDragging.value = false;
            const v = xToVal(thumbX.value, trackW.value);
            if (onChangeEnd) runOnJS(onChangeEnd)(v);
        });

    // Tap to jump
    const tap = Gesture.Tap()
        .enabled(!disabled)
        .onEnd(e => {
            'worklet';
            const x = clamp(e.x - thumbSize / 2, 0, trackW.value - thumbSize);
            thumbX.value = withSpring(x, { damping: 18, stiffness: 200 });
            const v = xToVal(x, trackW.value);
            displayVal.value = v;
            if (onChange) runOnJS(onChange)(v);
            if (onChangeEnd) runOnJS(onChangeEnd)(v);
        });

    const composed = Gesture.Simultaneous(pan, tap);

    // Animated styles
    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: thumbX.value }],
        backgroundColor: colors.thumb,
        borderColor: colors.thumbBorder,
        width: thumbSize,
        height: thumbSize,
        borderRadius: thumbSize / 2,
        borderWidth: 2,
        position: 'absolute',
        top: -(thumbSize / 2 - trackHeight / 2),
        shadowColor: THEME_COLORS.dark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: isDragging.value ? 0.18 : 0.10,
        shadowRadius: 0,
        elevation: isDragging.value ? 4 : 2,
    }));

    const fillW = useAnimatedStyle(() => ({
        width: fillStyle === 'filled' ? thumbX.value + thumbSize / 2 : 0,
        height: trackHeight,
        backgroundColor: colors.fill,
        borderRadius: trackHeight,
    }));

    // Display value (formatted)
    const fmt = formatValue
        ? formatValue
        : (v: number) => unit ? `${Math.round(v)}${unit}` : `${Math.round(v)}`;

    return (
        <View style={[{ width: '100%' }, style]}>
            {/* Label row */}
            {(label || showValue || budgetLabel !== undefined) && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {label && (
                            <Text style={{
                                fontFamily: 'font-elms-bold',
                                fontSize: 13,
                                color: disabled ? THEME_COLORS.grey : THEME_COLORS.dark,
                                letterSpacing: 0.2,
                            }}>
                                {label}
                            </Text>
                        )}
                        {budgetLabel !== undefined && (
                            <View style={{
                                backgroundColor: budgetWarning ? '#FAECE7' : THEME_COLORS.subtle,
                                borderRadius: 8,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                            }}>
                                <Text style={{
                                    fontFamily: 'font-elms-regular',
                                    fontSize: 11,
                                    color: budgetWarning ? '#993C1D' : THEME_COLORS.grey,
                                    fontStyle: 'italic',
                                }}>
                                    {budgetLabel}
                                </Text>
                            </View>
                        )}
                    </View>
                    {showValue && (
                        <AnimatedValueLabel
                            displayVal={displayVal}
                            fmt={fmt}
                            color={colors.fill}
                            disabled={disabled}
                        />
                    )}
                </View>
            )}

            {/* Track + thumb */}
            <GestureDetector gesture={composed}>
                <View
                    onLayout={onLayout}
                    style={{
                        width: '100%',
                        height: thumbSize,
                        justifyContent: 'center',
                        opacity: disabled ? 0.4 : 1,
                    }}
                >
                    {/* Track background */}
                    <View style={{
                        width: '100%',
                        height: trackHeight,
                        backgroundColor: THEME_COLORS.subtle,
                        borderRadius: trackHeight,
                        overflow: 'visible',
                    }}>
                        {/* Fill */}
                        <Animated.View style={fillW} />
                    </View>
                    {/* Thumb */}
                    <Animated.View style={thumbStyle} />
                </View>
            </GestureDetector>

            {/* Min / max labels */}
            {showMinMax && (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6,
                }}>
                    <Text style={{ fontFamily: 'font-elms-regular', fontSize: 10, color: THEME_COLORS.grey }}>
                        {fmt(min)}
                    </Text>
                    <Text style={{ fontFamily: 'font-elms-regular', fontSize: 10, color: THEME_COLORS.grey }}>
                        {fmt(max)}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Animated value label (reads SharedValue directly) ────────
function AnimatedValueLabel({
    displayVal,
    fmt,
    color,
    disabled,
}: {
    displayVal: SharedValue<number>;
    fmt: (v: number) => string;
    color: string;
    disabled: boolean;
}) {
    // We need to read the shared value in an animated style.
    // Since we're rendering text we use a workaround: Animated.Text
    // with useAnimatedProps on the 'text' prop isn't available,
    // so we read via a JS state bridge — acceptable here because
    // the label is cosmetic, not the slider itself.
    const [display, setDisplay] = React.useState(fmt(displayVal.value));

    useEffect(() => {
        // Poll — the slider's onChange will update the parent state
        // which re-renders this. This component just shows the initial.
    }, []);

    // The parent's onChange → setState → re-render path keeps this in sync.
    // Re-render on displayVal changes via the value prop chain.
    return (
        <View style={{
            backgroundColor: color === THEME_COLORS.dark ? THEME_COLORS.dark : `${color}18`,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 4,
            minWidth: 52,
            alignItems: 'center',
        }}>
            <Text style={{
                fontFamily: 'font-elms-bold',
                fontSize: 13,
                color: color === THEME_COLORS.dark ? THEME_COLORS.primary : color,
            }}>
                {fmt(displayVal.value)}
            </Text>
        </View>
    );
}

export default SunSlider;