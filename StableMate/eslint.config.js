// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "ios/*", "android/*", ".expo/*"],
  },
  {
    files: ["__tests__/**", "test/**", "jest.setup.ts"],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      // jest.mock factories are hoisted above imports, so they must require().
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
