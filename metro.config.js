const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const { withTransformersReactNativeMetro } = require('@automatalabs/react-native-transformers/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
    ...(config.resolver.assetExts ?? []),
    'onnx',
    'bin',
    'msgpack',
];

module.exports = withTransformersReactNativeMetro(
    withNativeWind(config, { input: './app/globals.css' })
);