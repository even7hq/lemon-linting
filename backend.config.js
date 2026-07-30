const commonConfig = require("./common.config");
const typescriptConfig = require("./typescript.config");
const sqlConfig = require("./sql.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...commonConfig,
    ...typescriptConfig,
    ...sqlConfig,

    {
        rules: {
            // Re-enable keyword-spacing for backend (no .js files conflict)
            "keyword-spacing": ["warn", { before: true, after: true }]
        }
    }
];
