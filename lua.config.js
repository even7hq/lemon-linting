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
                    "blank-line-before-block": require("./custom/lua/blank-line-before-block.js")
                }
            }
        },
        rules: {
            "lua/indent": ["warn", 4],
            "lua/no-same-line-blocks": "warn",
            "lua/require-jsdoc": "warn",
            "lua/require-call-parens": "warn",
            "lua/blank-line-before-block": "warn"
        }
    }
];

module.exports = config;
