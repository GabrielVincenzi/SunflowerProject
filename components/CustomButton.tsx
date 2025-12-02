import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

function CustomButton({ onPress, title, IconLeft, IconRight, classname, textClassname, ...props }: ButtonProps) {
    return (
        <TouchableOpacity
            className={`w-10/12 rounded-full flex flex-row justify-center items-center p-3 mb-5 ${classname}`}
            onPress={onPress}
            {...props}>
            {IconLeft && <IconLeft />}
            <Text className={`text-lg font-bold ${textClassname}`}>{title}</Text>
            {IconRight && <IconRight />}
        </TouchableOpacity>
    )
}

export default CustomButton