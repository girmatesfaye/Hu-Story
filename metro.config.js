const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.blockList =
  /.*[\\/]android[\\/](?:\.cxx|build)[\\/].*|.*[\\/]CMakeFiles[\\/]CMakeTmp[\\/].*|.*[\\/]ios[\\/]build[\\/].*/;

module.exports = withNativeWind(config, { input: "./global.css" });
