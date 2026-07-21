import { postDataRequest } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Modal, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import SunButton from "../SunButton";

const { height } = Dimensions.get("window");

export default function RequestDataPopup({ visible, onClose, prefillQuery = "" }: RequestDataPopupProps) {
    const authFetch = useAuthFetch();
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const inputRef = useRef<TextInput | null>(null);

    const bgOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(height);

    useEffect(() => {
        if (visible) {
            setMessage(prefillQuery.trim() ? `I'd like to request new data related to: "${prefillQuery.trim()}"\n\n` : "");
            setSubmitted(false);
            bgOpacity.value = withTiming(1, { duration: 600 });
            contentTranslateY.value = withTiming(0, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) });
            setTimeout(() => inputRef.current?.focus(), 820);
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        bgOpacity.value = withTiming(0, { duration: 500 });
        contentTranslateY.value = withTiming(height, { duration: 600, easing: Easing.bezier(0.7, 0, 0.84, 0) });
        setTimeout(onClose, 600);
    };

    const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
    const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: contentTranslateY.value }] }));

    const mutation = useMutation({
        mutationFn: () => postDataRequest(message.trim(), authFetch),
        onSuccess: () => { setSubmitted(true); setTimeout(handleClose, 1600); },
    });

    const canSubmit = message.trim().length > 0 && !mutation.isPending && !submitted;

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent statusBarTranslucent animationType="none">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 justify-end">
                    <Animated.View style={[bgStyle]} className="absolute inset-0 bg-dark/40 backdrop-blur-sm" />

                    <Animated.View style={[contentStyle]} className="bg-white  border-t-4 border-dark px-8 pt-10 pb-12">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-10">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-2xl bg-dark items-center justify-center">
                                    <Feather name="inbox" size={18} color="#F7CE46" />
                                </View>
                                <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-dark/40">
                                    DATA REQUEST
                                </Text>
                            </View>

                            <View className="relative">
                                <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                                <TouchableOpacity onPress={handleClose} className="w-12 h-12 items-center justify-center rounded-full border-2 border-dark bg-white">
                                    <Feather name="x" size={24} color="#141414" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Title */}
                        <Text className="text-4xl font-sf-bold italic text-dark tracking-tighter leading-tight mb-3">
                            Send Request
                        </Text>
                        <Text className="text-base font-sf-regular italic text-dark/60 leading-relaxed mb-8">
                            Describe what datasets or signal archives you'd like added to the synthesis engine.
                        </Text>

                        {/* Input Area */}
                        <View className="rounded-[32px] border-4 border-dark bg-white px-6 py-5 mb-8" style={{ height: 200 }}>
                            <TextInput
                                ref={inputRef}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                textAlignVertical="top"
                                placeholder="Describe the information nodes..."
                                placeholderTextColor="rgba(20,20,20,0.15)"
                                className="font-sf-bold italic text-dark text-lg leading-tight flex-1"
                                editable={!submitted}
                            />
                        </View>

                        {/* Submit Button with Shadow Layer */}
                        <View className="relative w-full">
                            <SunButton
                                text={submitted ? "REQUEST SENT ✓" : mutation.isPending ? "SENDING..." : "SUBMIT REQUEST"}
                                onPress={() => mutation.mutate()}
                                disabled={!canSubmit}
                            />
                        </View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}