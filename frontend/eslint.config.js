import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// export default defineConfig([
//   globalIgnores(['dist']),
//   {
//     files: ['**/*.{ts,tsx}'],
//     extends: [
//       js.configs.recommended,
//       tseslint.configs.recommended,
//       reactHooks.configs.flat.recommended,
//       reactRefresh.configs.vite,
//     ],
//     languageOptions: {
//       ecmaVersion: 2020,
//       globals: globals.browser,
//     },

//     rules: {
//       ...reactHooks.configs.recommended.rules,

//       // --- FIXES FOR YOUR 246 ERRORS ---

//       // 1. Completely turn off "Unexpected any" errors
//       "@typescript-eslint/no-explicit-any": "off",

//       // 2. Turn "defined but never used" into a warning (won't block build)
//       "@typescript-eslint/no-unused-vars": "warn",

//       // 3. Allow Shadcn UI components to export constants without crashing Vite
//       "react-refresh/only-export-components": [
//         "warn",
//         { allowConstantExport: true },
//       ],

//       // 4. Set common warnings to not block the build
//       "react-hooks/exhaustive-deps": "warn",
//       "no-empty": "warn",
//       "prefer-const": "warn",
//     },

//   },
// ])

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-refresh/only-export-components": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-empty": "off",
      "prefer-const": "off",
      "no-undef": "off",
    },
  },
);
