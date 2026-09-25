const {
    isViolatingInlineObjectLiteral,
    isDeclarativeConfigObjectLiteral
} = require("../scripts/codemods/inline-object-literal-policy");

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow inline object literals except empty objects or small shorthand-only objects",
            category: "Style",
            recommended: true
        },

        schema: [
            {
                type: "object",
                properties: {
                    maxShorthandProperties: {
                        type: "integer",
                        minimum: 1,
                        default: 2
                    },

                    emptyObjectImport: {
                        type: "string",
                        description: "Module specifier for emptyObject() used by the InlineObjectLiteralFix codemod"
                    }
                },

                additionalProperties: false
            }
        ]
    },

    create(context) {
        const maxShorthandProperties = context.options[0]?.maxShorthandProperties ?? 2;
        const emptyObjectImport = context.options[0]?.emptyObjectImport;

        /**
         * Builds the shell command to run InlineObjectLiteralFix on this file.
         *
         * @returns Codemod command line for the current file.
         */
        function codemodCommand() {
            const filename = context.filename ?? context.physicalFilename ?? "file.ts";
            const importFlag = emptyObjectImport
                ? ` --import-from "${emptyObjectImport}"`
                : " --import-from \"<your-emptyObject-module>\"";

            return `node node_modules/@lemon/linting/scripts/codemods/InlineObjectLiteralFix.mjs${importFlag} "${filename}"`;
        }

        return {
            ObjectExpression(node) {
                if (isDeclarativeConfigObjectLiteral(node)) {
                    return;
                }

                if (!isViolatingInlineObjectLiteral(node.properties, maxShorthandProperties)) {
                    return;
                }

                const message =
                    "Inline object literals are not allowed (use InlineObjectLiteralFix codemod or emptyObject + assignments, "
                    + "or at most {{max}} shorthand properties e.g. `{ name, tel }`). Codemod: {{command}}";

                context.report({
                    node,
                    message,
                    data: {
                        max: String(maxShorthandProperties),
                        command: codemodCommand()
                    }
                });
            }
        };
    }
};

module.exports.isAllowedInlineObject = function isAllowedInlineObject(node, maxShorthandProperties) {
    return !isViolatingInlineObjectLiteral(node.properties, maxShorthandProperties);
};
