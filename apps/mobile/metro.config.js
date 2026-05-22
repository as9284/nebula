const path = require("path");
const Module = require("module");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Web hoists Tailwind v4 at the repo root; NativeWind must resolve Tailwind v3.
const tailwindPkg = require.resolve("tailwindcss/package.json", {
  paths: [projectRoot],
});
const tailwindRoot = path.dirname(tailwindPkg);
const resolveFilename = Module._resolveFilename;
const tailwindParent = {
  paths: Module._nodeModulePaths(tailwindRoot),
  filename: path.join(tailwindRoot, "package.json"),
};
Module._resolveFilename = function (request, parent, isMain, options) {
  const fromNativeWind =
    parent &&
    typeof parent.filename === "string" &&
    parent.filename.includes(`${path.sep}nativewind${path.sep}`);
  if (
    fromNativeWind &&
    (request === "tailwindcss" || request.startsWith("tailwindcss/"))
  ) {
    return resolveFilename.call(
      this,
      request,
      tailwindParent,
      isMain,
      options
    );
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  tailwindcss: tailwindRoot,
};

module.exports = withNativeWind(config, { input: "./global.css" });
