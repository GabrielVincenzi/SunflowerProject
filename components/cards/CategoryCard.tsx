import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const CategoryCard = ({ category }: { category: string }) => {
    return (
        <TouchableOpacity
            className="w-40 h-full bg-background rounded-xl p-2 border-dark"
            style={{
                borderWidth: 1
            }}
            onPress={() =>
                router.push({
                    pathname: "/categories/[cat]",
                    params: {
                        cat: category,
                    }
                })
            }>
            <View className='flex-col items-center'>
                <Text className='text-md font-elms-bold text-dark my-2' numberOfLines={1}>
                    {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

export default CategoryCard