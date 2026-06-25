import { THEME_COLORS } from '@/constants/utilities';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface SunDrawerProps {
    visible: boolean;
    onClose: () => void;
    icon: keyof typeof Feather.glyphMap;
    label: string;
    title: string;
    children: React.ReactNode;
    ctaLabel: string;
    onCta: () => void;
    ctaDisabled?: boolean;
    ctaLoading?: boolean;
    maxHeightFraction?: number;
    sheetStyle?: ViewStyle;
}

export default function SunDrawer({
    visible,
    onClose,
    icon,
    label,
    title,
    children,
    ctaLabel,
    onCta,
    ctaDisabled = false,
    ctaLoading = false,
    maxHeightFraction = 0.82,
    sheetStyle,
}: SunDrawerProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Scrim */}
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(180)}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,20,18,0.45)' }}
            >
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                entering={SlideInDown.duration(380).springify().damping(22).stiffness(180)}
                exiting={SlideOutDown.duration(260)}
                style={[
                    {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxHeight: `${maxHeightFraction * 100}%`,
                        backgroundColor: THEME_COLORS.background,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        shadowColor: THEME_COLORS.dark,
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.10,
                        shadowRadius: 24,
                        elevation: 24,
                        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
                    },
                    sheetStyle,
                ]}
            >
                {/* Drag handle */}
                <View
                    style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: 'rgba(20,20,18,0.15)',
                        alignSelf: 'center', marginTop: 10, marginBottom: 6,
                    }}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}
                >
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            {/* Icon badge + label row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <View style={{
                                    width: 34, height: 34, borderRadius: 17,
                                    backgroundColor: THEME_COLORS.dark,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Feather name={icon} size={15} color="#F7CE46" />
                                </View>
                                <Text style={{
                                    fontSize: 10, fontFamily: 'elms-bold',
                                    textTransform: 'uppercase', letterSpacing: 1.4,
                                    color: 'rgba(20,20,18,0.4)',
                                }}>
                                    {label}
                                </Text>
                            </View>
                            {/* Title */}
                            <Text style={{
                                fontSize: 22, fontFamily: 'elms-bold',
                                fontStyle: 'italic', color: THEME_COLORS.dark,
                                lineHeight: 27, letterSpacing: -0.5,
                            }}>
                                {title}
                            </Text>
                        </View>

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.85}
                            style={{
                                width: 38, height: 38, borderRadius: 19,
                                backgroundColor: THEME_COLORS.light,
                                borderWidth: 1, borderColor: 'rgba(20,20,18,0.10)',
                                alignItems: 'center', justifyContent: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Feather name="x" size={16} color={THEME_COLORS.dark} />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: 'rgba(20,20,18,0.06)', marginBottom: 20 }} />

                    {/* Slot for specific drawer content */}
                    {children}
                </ScrollView>

                {/* Primary CTA — outside scroll so it stays pinned */}
                <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
                    <TouchableOpacity
                        onPress={onCta}
                        disabled={ctaDisabled || ctaLoading}
                        activeOpacity={0.9}
                        style={{
                            backgroundColor: ctaDisabled ? 'rgba(20,20,18,0.25)' : THEME_COLORS.dark,
                            borderRadius: 24, paddingVertical: 16,
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Text style={{
                            fontSize: 12, fontFamily: 'elms-bold',
                            color: '#F7CE46',
                            textTransform: 'uppercase', letterSpacing: 1.2,
                        }}>
                            {ctaLoading ? 'Please wait…' : ctaLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}