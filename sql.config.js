const noopParser = require("./parsers/noop-parser");
const localPlugin = require("./custom");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    {
        files: ["**/*.sql"],

        plugins: {
            local: localPlugin
        },

        languageOptions: {
            parser: noopParser
        },

        rules: {
            "local/no-sql-placeholder-fk": "error"
        }
    }
];
