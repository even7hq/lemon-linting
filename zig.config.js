const zigParser = require("./parsers/zig-parser.js");

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
        files: ["**/*.zig"],
        languageOptions: {
            parser: zigParser
        },
        plugins: {
            zig: {
                rules: {
                    "no-multi-spaces": require("./custom/zig/no-multi-spaces.js"),
                    "blank-line-before-block": require("./custom/zig/blank-line-before-block.js"),
                    "require-doc": require("./custom/zig/require-doc.js"),
                    "no-doc-dash-separator": require("./custom/zig/no-doc-dash-separator.js"),
                    "run-zlint": require("./custom/zig/run-zlint.js")
                }
            }
        },
        rules: {
            "zig/no-multi-spaces": "warn",
            "zig/blank-line-before-block": "warn",
            "zig/require-doc": "warn",
            "zig/no-doc-dash-separator": "warn",
            "zig/run-zlint": ["warn", { failIfMissing: false }]
        }
    }
];

module.exports = config;
