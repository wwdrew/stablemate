jest.mock("react-native-worklets", () =>
  require("react-native-worklets/lib/module/mock"),
);

// Reanimated 4 runs on its JS implementation in Jest, but jest-expo's native
// platform resolves the `.native` initializer, which calls a CSS API the JS
// implementation throws on. Use the non-native initializer instead — for both
// the built entry and the `src/` entry that `react-native-reanimated/mock`
// (used by `expo-router/testing-library`) imports.
jest.mock("react-native-reanimated/lib/module/initializers", () =>
  jest.requireActual("react-native-reanimated/lib/module/initializers.js"),
);
jest.mock("react-native-reanimated/src/initializers", () =>
  jest.requireActual("react-native-reanimated/src/initializers.ts"),
);
require("react-native-reanimated").setUpTests();

// MMKV's built-in test mock still loads the native Nitro module on import.
jest.mock("react-native-mmkv", () => ({
  createMMKV: () => {
    const values = new Map<string, string>();
    return {
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => values.set(key, value),
      remove: (key: string) => values.delete(key),
      clearAll: () => values.clear(),
    };
  },
}));

// LegendList renders no rows until it has measured layout, which never happens
// in Jest. FlatList renders its first window unmeasured and takes the same props.
jest.mock("@legendapp/list/react-native", () => ({
  LegendList: jest.requireActual("react-native").FlatList,
}));
