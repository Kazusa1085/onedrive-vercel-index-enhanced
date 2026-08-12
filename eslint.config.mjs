// eslint.config.mjs
import js from "@eslint/js";
import typescript from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import next from "@next/eslint-plugin-next";
import globals from "globals";

export default typescript.config(
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    rules: {
      // Convention: `_`-prefixed destructured names are intentionally unused.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // React + JSX
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '19' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // All components are fully typed with TypeScript props interfaces, so the
      // runtime PropTypes checks this rule enforces are redundant.
      "react/prop-types": "off",
      // autoFocus on search/oauth inputs is an intentional UX decision.
      "jsx-a11y/no-autofocus": "off",
    },
  },

  // React hooks rules also apply to plain .ts utility files (useLocalStorage).
  {
    files: ["**/*.ts"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Node.js runtime files: config files, serverless API routes and build tooling.
  {
    files: ["config/**/*.js", "next.config.js", "postcss.config.js", ".pnpmfile.cjs", "src/pages/api/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Next.js
  {
    plugins: {
      "@next/next": next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },

  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  }
);
