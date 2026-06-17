module.exports = {
  extends: `${__dirname}/../../.eslintrc.cjs`,
  ignorePatterns: ["dist"],
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["react-refresh"],
      extends: ["plugin:react-hooks/recommended"],
      parser: "@typescript-eslint/parser",
    },
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "react-refresh/only-export-components": [
      "error",
      { allowConstantExport: true },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {},
      alias: {
        map: [["@", "./src"]],
      },
    },
  },
};
