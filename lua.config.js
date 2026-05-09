const luaParser = require("./parsers/lua-parser.js");

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
        files: ["**/*.lua"],
        languageOptions: {
            parser: luaParser,
        },
        plugins: {
            lua: {
                rules: {
                    "indent": require("./custom/lua/indent.js"),
                    "no-same-line-blocks": require("./custom/lua/no-same-line-blocks.js"),
                    "require-jsdoc": require("./custom/lua/require-jsdoc.js"),
                    "require-call-parens": require("./custom/lua/require-call-parens.js"),
                    "blank-line-before-block": require("./custom/lua/blank-line-before-block.js"),
                    "consistent-doc-prefix": require("./custom/lua/consistent-doc-prefix.js"),
                    "no-param-dash-separator": require("./custom/lua/no-param-dash-separator.js")
                }
            }
        },
        rules: {
            "lua/indent": ["warn", 4],
            "lua/no-same-line-blocks": "warn",
            "lua/require-jsdoc": "warn",
            "lua/require-call-parens": "warn",
            "lua/blank-line-before-block": "warn",
            "lua/consistent-doc-prefix": "warn",
            "lua/no-param-dash-separator": "warn"
        }
    }
];

module.exports = config;
