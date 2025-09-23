// eslint.config.js — Flat config for ESLint 9+
// Node 22+ friendly
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Ignore build artifacts
  { ignores: ["dist/**", "node_modules/**"] },

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // Base
      ...js.configs.recommended.rules,

      // TS
      ...tseslint.configs["recommended"].rules,

      // React
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // not needed with modern React
      "react/prop-types": "off", // using TS types instead

      // Hooks
      ...reactHooks.configs.recommended.rules,

      // Style-ish preferences
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
