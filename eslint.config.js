import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import globals from "globals";

export default [
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: "latest",
        sourceType: "module",
        // build 用 tsconfig は demo の .tsx を含まないので、型情報ルール用に lint 専用の設定を使う
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      vue: vuePlugin,
    },
    rules: {
      ...tseslint.configs.strict.rules,
      // as を止める consistent-type-assertions は stylistic にしか入っていない
      ...tseslint.configs.stylistic.rules,
      ...vuePlugin.configs["flat/recommended"].rules,
      "vue/multi-word-component-names": "off",
      // 未定義参照は TypeScript 自身が検出する。型のみの参照 (React.FormEvent 等) を誤検出する
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      // 型情報を使うルール。同ブロックの parserOptions.project から型が供給される
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-base-to-string": "error",
      // 以下は既存コードに違反があるため warn。件数を減らしてから error に上げる
      "@typescript-eslint/consistent-type-assertions": ["warn", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/array-type": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
