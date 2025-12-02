import React from 'react';
import { Image, Text, TextInput, View } from 'react-native';

function InputField({ label, placeholder, icon, secureTextEntry = false, classname, ...props }: InputProps) {
    return (
        <View className="my-2 w-full">
            <Text className='text-lg font-semibold mb-3'>{label}</Text>
            <View className='flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500'>
                {icon && <Image source={icon} className='w-6 h-6 ml-4' />}
                <TextInput
                    className='rounded-full p-4 font-semibold text-md flex-1 text-left'
                    secureTextEntry={secureTextEntry}
                    {...props}
                />
            </View>
        </View>
    )
}

export default InputField