/**
 * Merges one or more lemon-linting base configs with project-specific overrides.
 * Handles deep merging of `rules`, `plugins`, `overrides`, `extends`, and `settings`.
 *
 * @param {string | string[]} configs - One or more config module paths (e.g. "@lemon/linting/react").
 * @param {object} [options] - Project-specific additions merged on top.
 * @returns {object} A merged ESLint config object.
 *
 * @example
 * // .eslintrc.js
 * const { defineConfig } = require("@lemon/linting/define");
 *
 * module.exports = defineConfig("@lemon/linting/react", {
 *     overrides: [{
 *         files: ["** /*.ts", "** /*.tsx"],
 *         parser: require("@lemon/linting/ts-parser-path"),
 *         parserOptions: { ecmaFeatures: { jsx: true }, project: true }
 *     }]
 * });
 */
function defineConfig(configs, options = {}) {
    const bases = (Array.isArray(configs) ? configs : [configs]).map((c) => require(c));

    const merged = bases.reduce((acc, base) => deepMergeConfig(acc, base), {});
    const result = deepMergeConfig(merged, options);

    // Always set root: true so ESLint stops traversing up the directory tree
    result.root = true;

    return result;
}

/**
 * Deep-merges two ESLint config objects.
 * Arrays (plugins, extends, overrides) are concatenated and de-duplicated where appropriate.
 * Objects (rules, settings) are shallow-merged with the right side taking precedence.
 *
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function deepMergeConfig(base, override) {
    const result = { ...base, ...override };

    // Merge array fields (deduplicate strings)
    for (const key of ["plugins", "extends"]) {
        const a = toArray(base[key]);
        const b = toArray(override[key]);
        const merged = [...a, ...b.filter((x) => !a.includes(x))];

        if (merged.length > 0) {
            result[key] = merged;
        }
    }

    // Concatenate overrides
    if (base.overrides || override.overrides) {
        result.overrides = [...toArray(base.overrides), ...toArray(override.overrides)];
    }

    // Merge rules (right side wins per-key)
    if (base.rules || override.rules) {
        result.rules = { ...(base.rules || {}), ...(override.rules || {}) };
    }

    // Merge settings
    if (base.settings || override.settings) {
        result.settings = { ...(base.settings || {}), ...(override.settings || {}) };
    }

    return result;
}

/**
 * @param {any} val
 * @returns {any[]}
 */
function toArray(val) {
    if (!val) {
        return [];
    }

    return Array.isArray(val) ? val : [val];
}

module.exports = { defineConfig };
