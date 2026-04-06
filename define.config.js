/**
 * Merges one or more lemon-linting flat config arrays with project-specific additions.
 *
 * In ESLint flat config, composition is just array spreading — no special merge logic needed.
 * Each element of the array is a config object applied in order.
 *
 * @param {string | string[]} configs - One or more config module paths (e.g. "@lemon/linting/backend.config").
 * @param {import("eslint").Linter.Config[]} [extra] - Additional config objects appended at the end.
 * @returns {import("eslint").Linter.Config[]}
 *
 * @example
 * // eslint.config.js
 * const { defineConfig } = require("@lemon/linting/define.config");
 *
 * module.exports = defineConfig("@lemon/linting/react.config", [
 *     {
 *         files: ["** /*.ts", "** /*.tsx"],
 *         languageOptions: { parserOptions: { project: true } }
 *     }
 * ]);
 */
function defineConfig(configs, extra = []) {
    const bases = (Array.isArray(configs) ? configs : [configs])
        .flatMap((c) => require(c));

    return [...bases, ...extra];
}

module.exports = { defineConfig };
