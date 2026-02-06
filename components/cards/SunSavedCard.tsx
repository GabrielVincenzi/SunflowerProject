import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const SunSavedCard = ({ data: { id, title, description, db_name, vars, chart_type, chart_id, }, savedAt }: SavedCardProps) => {

    return (
        <TouchableOpacity
            className='w-full bg-background rounded-xl p-4 flex flex-row border-dark'
            style={{
                borderWidth: 1
            }}
            onPress={() =>
                router.push({
                    pathname: "/infos/[id]", // /infos/[id]
                    params: {
                        id,
                        chart_id,
                        title,
                        description,
                        db: db_name,
                        chart_type,
                        variables: vars
                    }
                })
            }>
            <View className='flex-col items-left justify-between ml-5'>
                <Text className='text-md font-elms-bold text-dark my-2' numberOfLines={1}>{title}</Text>
                <Text className='text-sm text-grey font-medium my-1'>{description}</Text>
            </View>
        </TouchableOpacity>
    )
}

export default SunSavedCard