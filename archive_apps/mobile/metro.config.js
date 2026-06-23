const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

if (!defaultConfig.resolver.sourceExts.includes('cjs')) {
    defaultConfig.resolver.sourceExts.push('cjs');
}

module.exports = defaultConfig;
