import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      ".specify/**",
      ".agents/**",
      ".cursor/**",
    ],
  },
];

export default eslintConfig;
