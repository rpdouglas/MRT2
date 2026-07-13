const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");

module.exports = tseslint.config(
  {
    ignores: ["lib/**/*", "generated/**/*"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "import/no-unresolved": "off",
      "indent": ["error", 2],
    },
  }
);
