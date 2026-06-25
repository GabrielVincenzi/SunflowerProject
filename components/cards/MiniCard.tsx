import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MiniCardProps {
    icon?: string;
    iconGlyph?: keyof typeof Feather.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    featured?: boolean;
    isDark?: boolean;
    onPressIn?: () => void;
    onPressOut?: () => void;
}


export const MiniCard = ({
    icon,
    iconGlyph,
    title,
    subtitle,
    onPress,
    featured = false,
    isDark = false,
    onPressIn,
    onPressOut,
}: MiniCardProps) => {
    const bgColor = isDark ? THEME_COLORS.dark : THEME_COLORS.background;
    const borderColor = featured ? THEME_COLORS.dark : `${THEME_COLORS.dark}10`;
    const titleColor = isDark ? THEME_COLORS.background : THEME_COLORS.dark;
    const subtitleColor = isDark ? `${THEME_COLORS.background}40` : `${THEME_COLORS.dark}40`;
    const iconBgColor = featured ? THEME_COLORS.background : THEME_COLORS.primary;
    const iconColor = featured ? THEME_COLORS.dark : THEME_COLORS.dark;


    return (
        <View className="flex-1 relative aspect-square">
            {/* Shadow Layer */}
            <View
                className="absolute inset-0 bg-dark rounded-[40px]"
                style={{ transform: [{ translateX: featured ? 6 : 4 }, { translateY: featured ? 6 : 4 }] }}
            />

            {featured && (
                <>
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: -36,
                            right: -36,
                            width: 130,
                            height: 130,
                            borderRadius: 65,
                            backgroundColor: THEME_COLORS.primary,
                            opacity: 0.16,
                        }}
                    />
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: -14,
                            right: -10,
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: THEME_COLORS.primary,
                            opacity: 0.22,
                        }}
                    />
                </>
            )}

            {/* Main Card */}
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.9}
                className="flex-1 rounded-[40px] p-6 justify-between overflow-hidden border-2"
                style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                }}
            >
                {/* Left accent strip - featured cards get primary yellow */}
                <View
                    className="absolute left-0 top-[16%] bottom-[16%] w-[4px]"
                    style={{
                        backgroundColor: featured ? THEME_COLORS.primary : `${THEME_COLORS.dark}10`
                    }}
                />

                {/* Icon */}
                <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: iconBgColor }}
                >
                    {iconGlyph ? (
                        <Feather name={iconGlyph} size={16} color={iconColor} />
                    ) : (
                        <Text className={`text-xs font-elms-bold italic ${isDark ? 'text-white' : 'text-dark'}`}>
                            {icon}
                        </Text>
                    )}
                </View>

                {/* Title & Subtitle */}
                <View>
                    <Text
                        className="text-2xl font-elms-bold tracking-tighter italic leading-tight"
                        style={{ color: titleColor }}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            className="text-[10px] mt-1 uppercase font-elms-regular tracking-widest leading-none"
                            style={{ color: subtitleColor }}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};