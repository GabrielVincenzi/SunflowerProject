import InfiniteChartList from "@/components/ChartList";
import SearchBar from "@/components/SearchBar";
import { images } from "@/constants/images";
import React, { useCallback, useRef, useState } from "react";
import {
    Image,
    Keyboard,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from "react-native";

const SearchPage = () => {
    const [input, setInput] = useState<string>("");
    const [committedQuery, setCommittedQuery] = useState<string>(""); // only updated when Search pressed
    const inputRef = useRef<TextInput | null>(null);

    const handleSearch = useCallback(() => {
        setCommittedQuery(input.trim());
        inputRef.current?.blur();
    }, [input]);

    const renderHeader = useCallback(() => (
        <View>
            <View className="w-full flex-row justify-center mt-20 items-center">
                <Image source={images.logoMain} className="w-16 h-16" />
            </View>

            <View className="my-5 px-6">
                <SearchBar
                    placeholder="Search ..."
                    value={input}
                    onChangeText={setInput}
                    onPress={handleSearch} // the Search button inside SearchBar will call this
                    // pass inputRef so SearchBar can wire it to TextInput (optional)
                    inputRef={inputRef}
                    editable={true}
                    autoFocus={true}
                />
            </View>

            {/* Show a small "results for" when there's a committed query */}
            {committedQuery ? (
                <View className="px-6 mb-2">
                    <Text className="text-xl text-black font-bold">
                        Search results for{" "}
                        <Text className="text-accent">{committedQuery}</Text>
                    </Text>
                </View>
            ) : null}
        </View>
    ), [input, committedQuery, handleSearch]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 bg-background px-4">
                {renderHeader()}

                {!committedQuery ? (
                    <View className="flex-1 justify-center px-4">
                        <Text className="text-center text-gray-500">
                            The future of Data Driven Information is here
                        </Text>
                    </View>
                ) : (
                    <InfiniteChartList
                        searchQuery={committedQuery}
                        searchCategory={""}
                        renderHeader={null}
                        pageLimit={5}
                    />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default SearchPage;
