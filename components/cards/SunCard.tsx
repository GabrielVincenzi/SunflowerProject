import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const SunCard = ({ id, title, description, db_name, vars, chart_type }: CardProps) => {
    return (
        <TouchableOpacity
            className='w-full bg-background rounded-xl p-4 flex flex-row border-dark'
            style={{
                borderWidth: 1
            }}
            activeOpacity={1}
            onPress={() =>
                router.push({
                    pathname: "/infos/[id]", // /infos/[id]
                    params: {
                        id,
                        title,
                        description,
                        db: db_name,
                        chart_type,
                        variables: JSON.stringify(vars)
                    }
                })
            }>
            <View className='flex-col items-left justify-between mx-4'>
                <Text className='text-lg font-elms-bold text-dark' numberOfLines={1}>{title}</Text>
                <Text className='text-sm text-grey font-medium my-1'>{description}</Text>
            </View>
        </TouchableOpacity>
    )
}

export default SunCard