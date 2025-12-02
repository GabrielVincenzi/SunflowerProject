import React from "react";
import {
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const SearchBar = ({
    placeholder,
    onPress,
    value,
    onChangeText,
    editable = true,
    autoFocus = false,
    inputRef,
}: SearchBarProps) => {
    return (
        <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-2 gap-x-2">
            {editable ? (
                <>
                    <TextInput
                        ref={inputRef}
                        placeholder={placeholder}
                        value={value}
                        onChangeText={onChangeText}
                        placeholderTextColor="#A8B5DB"
                        autoFocus={autoFocus}
                        className="flex-1 ml-4 text-black"
                        returnKeyType="search"
                        onSubmitEditing={() => onPress?.()}
                    />

                    <TouchableOpacity
                        onPress={onPress}
                        activeOpacity={0.8}
                        disabled={!value.trim()}
                        className="ml-3 px-4 py-2 rounded-full bg-primary justify-center"
                        style={{
                            opacity: value.trim() ? 1 : 0.5,
                        }}
                    >
                        <Image
                            source={require("../assets/icons/search.png")}
                            className="size-5"
                            resizeMode="contain"
                            tintColor="#fff"
                        />
                    </TouchableOpacity>
                </>
            ) : (
                <TouchableOpacity className="flex-1 ml-2" onPress={onPress} activeOpacity={0.7}>
                    <Text className="text-black text-base text-left">{placeholder}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default SearchBar;
