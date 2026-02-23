import globals from "globals";

export default [
	{
		files: ["**/*.js", "**/*.mjs"],
		ignores: [
			"**/node_modules/**",
			"**/*.min.js",
			"pixy.module.min.js",
			"fxgen.module.min.js"
		],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			"no-undef": "error",
			"no-unused-vars": ["warn", { "args": "none" }]
		}
	}
];
