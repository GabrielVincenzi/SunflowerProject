// QuestionCardAnimated.tsx
import React, { useCallback, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import QuestionPopup from "../QuestionPopUp";

const QuestionCard = ({
    title,
    description,
    image,
    popupInfo,
    popupContent,
}: QuestionProps) => {
    const [popupVisible, setPopupVisible] = useState(false);

    const openPopup = useCallback(() => {
        setPopupVisible(true);
    }, []);

    const handleClosePopup = useCallback(() => {
        // called by QuestionPopup after its exit animation completes
        setPopupVisible(false);
    }, []);

    return (
        <>
            {/* CARD (image/title/description only) */}
            <TouchableOpacity
                className="w-full bg-background rounded-xl p-4 flex-row border border-dark"
                style={{ borderWidth: 1 }}
                activeOpacity={0.9}
                onPress={openPopup}
                accessibilityRole="button"
                accessibilityLabel={`Open ${title} details`}
            >
                {image ? (
                    <Image
                        source={{ uri: image }}
                        className="w-16 h-16 rounded-md mr-4"
                        resizeMode="cover"
                        accessible
                        accessibilityLabel={`${title} thumbnail`}
                    />
                ) : null}

                <View className="flex-1 flex-col justify-center">
                    <Text className="text-lg font-elms-bold text-dark" numberOfLines={1}>
                        {title}
                    </Text>
                    {description ? (
                        <Text className="text-sm text-grey font-medium mt-1" numberOfLines={2}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>

            {/* Popup component (separate component) */}
            <QuestionPopup
                visible={popupVisible}
                info={popupInfo}
                onClose={handleClosePopup}
                title={title}
                popupContent={popupContent}
            />
        </>
    );
}

export default QuestionCard;