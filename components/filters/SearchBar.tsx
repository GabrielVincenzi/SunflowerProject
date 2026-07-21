import React from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

const SearchBar = ({
    placeholder,
    onPress,
    value = "",
    onChangeText,
    editable = true,
    autoFocus = false,
    inputRef,
}: any) => {
    return (
        <View className="relative w-full">
            {/* 1. Brutalist Shadow Layer */}
            <View
                className="absolute inset-0 bg-dark rounded-[24px]"
                style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
            />
            {/* 2. Content Layer */}
            <View className="flex-row items-center bg-white border-2 border-dark rounded-[24px] px-5 py-2">
                {editable ? (
                    <>
                        <TextInput
                            ref={inputRef}
                            placeholder={placeholder}
                            value={value}
                            onChangeText={onChangeText}
                            placeholderTextColor="rgba(20, 20, 20, 0.2)"
                            autoFocus={autoFocus}
                            // Bold Italic input style
                            className="flex-1 font-sf-bold italic text-dark text-lg tracking-tight"
                            returnKeyType="search"
                            onSubmitEditing={() => onPress?.()}
                        />

                        <TouchableOpacity
                            onPress={onPress}
                            activeOpacity={0.8}
                            disabled={!value.trim()}
                            // Square-ish brutalist search button
                            className="ml-2 w-12 h-12 rounded-3xl bg-dark items-center justify-center"
                            style={{ opacity: value.trim() ? 1 : 0.4 }}
                        >
                            <Image
                                source={require("../../assets/icons/search.png")}
                                className="w-5 h-5"
                                resizeMode="contain"
                                tintColor="#F7CE46"
                            />
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        className="flex-1 flex-row items-center py-4 px-2"
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={require("../../assets/icons/search.png")}
                            className="w-4 h-4 mr-4 opacity-40"
                            resizeMode="contain"
                            tintColor="#141414"
                        />
                        <Text className="text-dark/40 font-sf-bold italic text-lg tracking-tight">
                            {placeholder}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default SearchBar;