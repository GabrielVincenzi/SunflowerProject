import { EXPORT_OPTIONS } from '@/constants/utilities';
import { popupEntering, popupExiting } from '@/functions/animations';
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated from "react-native-reanimated";

export const ExportSheet: React.FC<ExportSheetProps> = ({
    onClose,
    onExport,
    isExporting,
    exportError,
    title,
    windowWidth,
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("png");

    return (
        <Animated.View
            entering={popupEntering}
            exiting={popupExiting}
            className="bg-white border-t-4 border-dark px-8 pt-6"
            style={{ paddingBottom: Platform.OS === "ios" ? 50 : 32 }}
        >
            {/* Drag Handle */}
            <View className="w-12 h-1.5 bg-dark/10 rounded-full self-center mb-8" />

            {/* Header Section */}
            <View className="flex-row justify-between items-start mb-8">
                <View className="flex-1 mr-4">
                    <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40 mb-3">
                        EXPORT SIGNAL // ASSET
                    </Text>
                    <Text
                        className="text-4xl font-elms-bold italic tracking-tighter text-dark"
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                </View>

                {/* Brutalist Close Button */}
                <View className="relative">
                    <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-12 h-12 items-center justify-center rounded-full border-2 border-dark bg-white"
                    >
                        <Feather name="x" size={24} color="#141414" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Divider Line */}
            <View className="h-[2px] bg-dark/5 w-full mb-8" />

            {/* Format Selection Header */}
            <Text className="text-[10px] uppercase font-elms-bold tracking-[0.3em] text-dark/30 mb-6">
                SELECT FORMAT
            </Text>

            {/* Format Options List */}
            <View className="gap-y-4 mb-4">
                {EXPORT_OPTIONS.map((opt) => {
                    const active = selectedFormat === opt.format;
                    return (
                        <TouchableOpacity
                            key={opt.format}
                            onPress={() => setSelectedFormat(opt.format)}
                            activeOpacity={0.85}
                            className={`flex-row items-center p-5 rounded-[28px] border-2 border-dark ${active ? "bg-primary" : "bg-white"}`}
                        >
                            {/* Format Icon Block */}
                            <View className={`w-12 h-12 rounded-2xl border-2 border-dark items-center justify-center mr-4 ${active ? 'bg-dark' : 'bg-primary/10'}`}>
                                <Feather
                                    name={opt.icon}
                                    size={22}
                                    color={active ? "#F7CE46" : "#141414"}
                                />
                            </View>

                            {/* Format Label & Context */}
                            <View className="flex-1">
                                <Text className="text-xl font-elms-bold italic tracking-tight text-dark leading-none">
                                    {opt.label}
                                </Text>
                                <Text className="text-xs font-elms-regular italic text-dark/40 mt-1">
                                    {opt.sublabel}
                                </Text>
                            </View>

                            {/* Brutalist Option Radio */}
                            <View className={`w-6 h-6 rounded-full border-2 border-dark items-center justify-center bg-white ${active ? 'border-dark' : 'border-dark/10'}`}>
                                {active && <View className="w-3 h-3 rounded-full bg-dark" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {exportError && (
                <View className="flex-row items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-2 mb-6">
                    <Feather name="alert-circle" size={16} color="#ef4444" />
                    <Text className="text-xs font-elms-bold italic text-red-500 flex-1">{exportError}</Text>
                </View>
            )}

            {/* Export CTA with Shadow Layer */}
            <View className="relative w-full mt-6">
                <TouchableOpacity
                    onPress={() => onExport(selectedFormat)}
                    disabled={isExporting}
                    activeOpacity={0.9}
                    className={`py-4 rounded-[32px] border-2 border-dark flex-row items-center justify-center gap-4 ${isExporting ? "bg-dark/40" : "bg-dark"}`}
                >
                    {isExporting ? (
                        <>
                            <ActivityIndicator size="small" color="#F7CE46" />
                            <Text className="text-primary font-elms-bold italic text-md uppercase tracking-widest leading-none">
                                EXPORTING...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Feather
                                name={selectedFormat === "csv" ? "download" : "share-2"}
                                size={22}
                                color="#F7CE46"
                            />
                            <Text className="text-primary font-elms-bold italic text-md uppercase tracking-[0.2em] leading-none">
                                {selectedFormat === "csv" ? "EXPORT CSV" : "SHARE SIGNAL"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};