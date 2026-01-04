// QuestionPopup.tsx
import { fetchUserQuestions } from "@/services/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type QuestionPopupProps<T = any> = {
    visible: boolean;
    info?: T | string;
    onClose: () => void;
    title?: string;
    popupContent?: React.ReactNode;
};

const SPRING_CONFIG = { damping: 12, stiffness: 120, mass: 1 };
const BOUNCE_IN_MS = 480;
const EXPAND_MS = 480;
const CONTENT_FADE_MS = 360;
const BACKDROP_IN_MS = BOUNCE_IN_MS + 120;
const BACKDROP_OUT_MS = CONTENT_FADE_MS + 120;
const SHRINK_MS = 360;
const SLIDE_DOWN_MS = 360;

export default function QuestionPopup<T = any>({
    visible,
    info,
    onClose,
    title = "Details",
    popupContent,
}: QuestionPopupProps<T>) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const userId = user?.id ?? "";
    const queryclient = useQueryClient();

    // Fetch saved graphs
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['questionnaire', 'odd', userId],
        queryFn: () => fetchUserQuestions({ userId, numQuestions: 1 }),
        enabled: false, //!!userId,
    });

    ///// Entrance and exit animations
    const { width, height } = Dimensions.get("window");

    const SMALL_SQ = Math.round(Math.min(width, height) * 0.24);
    const scaleToCover = (Math.max(width, height) / SMALL_SQ) * 1.2;

    const [mounted, setMounted] = useState(visible);
    const [isInteractive, setIsInteractive] = useState(false);
    const timersRef = useRef<number[]>([]);

    // Shared animation values
    const dummyScale = useSharedValue(1);
    const dummyTranslateY = useSharedValue(height); // offscreen
    const contentOpacity = useSharedValue(0);
    const contentScale = useSharedValue(0.98);
    const backdropOpacity = useSharedValue(0);

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const dummyStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: dummyTranslateY.value }, { scale: dummyScale.value }],
    }));
    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ scale: contentScale.value }],
    }));

    // Clear timers on unmount
    useEffect(() => () => timersRef.current.forEach((t) => clearTimeout(t)), []);

    // Entrance animation
    useEffect(() => {
        if (!visible) return;

        setMounted(true);
        setIsInteractive(false);

        dummyTranslateY.value = height;
        dummyScale.value = 1;
        contentOpacity.value = 0;
        contentScale.value = 0.98;
        backdropOpacity.value = 0;

        // fade in backdrop gradually
        backdropOpacity.value = withTiming(1, { duration: BACKDROP_IN_MS, easing: Easing.out(Easing.cubic) });

        // bounce dummy square from bottom to center
        dummyTranslateY.value = withSpring(0, SPRING_CONFIG);

        timersRef.current.push(
            setTimeout(() => {
                // expand square to cover screen
                dummyScale.value = withTiming(scaleToCover, { duration: EXPAND_MS, easing: Easing.out(Easing.cubic) });

                // fade in popup content after expand
                timersRef.current.push(
                    setTimeout(() => {
                        contentOpacity.value = withTiming(1, { duration: CONTENT_FADE_MS, easing: Easing.out(Easing.cubic) });
                        contentScale.value = withTiming(1, { duration: CONTENT_FADE_MS, easing: Easing.out(Easing.cubic) });
                        setIsInteractive(true);
                    }, EXPAND_MS + 8)
                );
            }, BOUNCE_IN_MS)
        );
    }, [visible]);

    // Exit animation
    useEffect(() => {
        if (visible) return;
        if (!mounted) return;

        setIsInteractive(false);

        contentOpacity.value = withTiming(0, { duration: CONTENT_FADE_MS / 1.1, easing: Easing.in(Easing.cubic) });
        contentScale.value = withTiming(0.98, { duration: CONTENT_FADE_MS / 1.1, easing: Easing.in(Easing.cubic) });
        backdropOpacity.value = withTiming(0, { duration: BACKDROP_OUT_MS, easing: Easing.in(Easing.cubic) });

        timersRef.current.push(
            setTimeout(() => {
                dummyScale.value = withTiming(1, { duration: SHRINK_MS, easing: Easing.in(Easing.cubic) });
                timersRef.current.push(
                    setTimeout(() => {
                        dummyTranslateY.value = withTiming(height, { duration: SLIDE_DOWN_MS, easing: Easing.in(Easing.quad) });
                        timersRef.current.push(
                            setTimeout(() => {
                                setMounted(false);
                                onClose();
                            }, SLIDE_DOWN_MS + 8)
                        );
                    }, SHRINK_MS + 8)
                );
            }, 90)
        );
    }, [visible, mounted]);

    const startClose = () => {
        if (!mounted) return;
        setIsInteractive(false);

        contentOpacity.value = withTiming(0, { duration: CONTENT_FADE_MS / 1.1, easing: Easing.in(Easing.cubic) });
        contentScale.value = withTiming(0.98, { duration: CONTENT_FADE_MS / 1.1, easing: Easing.in(Easing.cubic) });
        backdropOpacity.value = withTiming(0, { duration: BACKDROP_OUT_MS, easing: Easing.in(Easing.cubic) });

        timersRef.current.push(
            setTimeout(() => {
                dummyScale.value = withTiming(1, { duration: SHRINK_MS, easing: Easing.in(Easing.cubic) });
                timersRef.current.push(
                    setTimeout(() => {
                        dummyTranslateY.value = withTiming(height, { duration: SLIDE_DOWN_MS, easing: Easing.in(Easing.quad) });
                        timersRef.current.push(
                            setTimeout(() => {
                                setMounted(false);
                                onClose();
                            }, SLIDE_DOWN_MS + 8)
                        );
                    }, SHRINK_MS + 8)
                );
            }, 90)
        );
    };

    if (!mounted) return null;

    return (
        <Modal visible={mounted} transparent animationType="none" statusBarTranslucent>
            <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
                {/* Backdrop */}
                <Animated.View
                    pointerEvents={isInteractive ? "auto" : "none"}
                    className="absolute inset-0 bg-background"
                    style={[{ zIndex: 10 }, backdropStyle]}
                />

                {/* Dummy square */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            width: SMALL_SQ,
                            height: SMALL_SQ,
                            borderRadius: 12,
                            backgroundColor: "#F2BB16",
                            position: "absolute",
                            zIndex: 20,
                            elevation: Platform.OS === "android" ? 30 : undefined,
                            shadowColor: "#F2BB16",
                            shadowOpacity: 0.24,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 6 },
                        },
                        dummyStyle,
                    ]}
                />

                {/* Popup content */}
                <Animated.View
                    pointerEvents={isInteractive ? "auto" : "none"}
                    className="p-8 inset-0 absolute justify-center items-center z-20"
                    style={[contentStyle]}
                >
                    <View className="flex-1 bg-background rounded-2xl p-6 border border-dark w-full">
                        {/* Header */}
                        <View className="flex-row justify-between items-start">
                            <Text className="text-xl font-elms-bold text-dark">{title}</Text>
                            <TouchableOpacity onPress={startClose} className="p-2">
                                <Text className="text-lg font-bold text-grey">✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Body */}
                        <View className="my-2 flex-1">
                            {popupContent ? popupContent : info ? (
                                <Text className="text-sm text-grey">{typeof info === "string" ? info : JSON.stringify(info, null, 2)}</Text>
                            ) : (
                                <Text className="text-sm text-grey">No details provided.</Text>
                            )}
                        </View>

                        {/* Footer */}
                        <View className="mt-4 flex-row justify-end">
                            <TouchableOpacity onPress={startClose} className="px-3 py-2">
                                <Text className="text-primary font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
