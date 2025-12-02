// QuestionPopup.tsx
import React, { useEffect } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const ANIM_DURATION = 260;
const AnimatedViewAny = (Animated.View as unknown) as any;

export default function QuestionPopup<T = any>({
    visible,
    info,
    onClose,
    title = "Details",
    popupContent,
}: QuestionPopupProps<T>) {
    // Shared values for animation
    const translateY = useSharedValue(120);
    const backdropOpacity = useSharedValue(0);

    // animated styles
    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    // when visible turns true, animate in
    useEffect(() => {
        if (!visible) return;

        // reset start states
        translateY.value = 120;
        backdropOpacity.value = 0;

        backdropOpacity.value = withTiming(1, {
            duration: ANIM_DURATION,
            easing: Easing.out(Easing.cubic),
        });

        translateY.value = withTiming(0, {
            duration: ANIM_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [visible, translateY, backdropOpacity]);

    // close handler that plays exit animation then calls onClose after timeout
    const requestClose = () => {
        // animate out
        backdropOpacity.value = withTiming(0, {
            duration: ANIM_DURATION,
            easing: Easing.in(Easing.cubic),
        });

        translateY.value = withTiming(120, {
            duration: ANIM_DURATION,
            easing: Easing.in(Easing.cubic),
        });

        // call onClose after animation finishes (avoid runOnJS)
        setTimeout(() => {
            onClose();
        }, ANIM_DURATION);
    };

    // Render nothing if not visible (parent can choose to mount/unmount; we keep modal controlled by `visible`)
    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={() => { }}>
            {/* Animated backdrop (not pressable) */}
            <AnimatedViewAny
                className="absolute inset-0 bg-black/40"
                style={backdropStyle}
                pointerEvents="auto"
            />

            {/* Bottom sheet container */}
            <View className="absolute inset-0 justify-end items-center p-5">
                <AnimatedViewAny
                    className="bg-white rounded-2xl p-5 border border-dark w-full max-w-[720px]"
                    style={cardStyle}
                    accessible
                    accessibilityRole="dialog"
                    accessibilityLabel={`${title} details`}
                >
                    {/* Header: title + explicit X */}
                    <View className="flex-row justify-between items-start">
                        <Text className="text-xl font-elms-bold text-dark">{title}</Text>

                        <TouchableOpacity
                            onPress={requestClose}
                            className="p-2"
                            accessibilityRole="button"
                            accessibilityLabel={`Close ${title} dialog`}
                        >
                            <Text className="text-lg font-bold text-grey">✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Body: either popupContent or a default render of info */}
                    <View className="my-2">
                        {popupContent ? (
                            popupContent
                        ) : (
                            <>
                                {/* Default rendering: stringify small info object */}
                                {info ? (
                                    <Text className="text-sm text-grey">
                                        {typeof info === "string"
                                            ? info
                                            : JSON.stringify(info, null, 2)}
                                    </Text>
                                ) : (
                                    <Text className="text-sm text-grey">
                                        No details provided.
                                    </Text>
                                )}
                            </>
                        )}
                    </View>

                    {/* Footer close */}
                    <View className="mt-4 flex-row justify-end">
                        <TouchableOpacity onPress={requestClose} className="px-3 py-2" accessibilityRole="button">
                            <Text className="text-primary font-medium">Close</Text>
                        </TouchableOpacity>
                    </View>
                </AnimatedViewAny>
            </View>
        </Modal>
    );
}
