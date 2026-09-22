/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require documentation for functions in Lua",
            category: "Best Practices",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        const {
            getCommentRunAboveLine,
            isTsdocCommentRun,
            lineIndexAtOffset
        } = require("./LuaDocCommentRun");

        /**
         * Returns the doc block immediately above a function declaration by
         * scanning source text lines directly - the Lua parser does not populate
         * node.loc reliably, so we cannot use getCommentsBefore() which would
         * return every comment in the file above the (always-line-1) node.
         *
         * A doc block is a consecutive run of `--` / `---` lines directly above
         * the `function` keyword that contains at least one @tag.
         *
         * @param node Lua function AST node.
         * @returns Combined doc text or null when no TSDoc block exists.
         */
        function getDocBlockFromSource(node) {
            // node.range[0] is the character offset of `function` in the source.
            if (!node.range) return null;

            const text = sourceCode.getText();
            const lines = text.split("\n");
            const funcLine = lineIndexAtOffset(text, node.range[0]);
            const run = getCommentRunAboveLine(lines, funcLine);

            if (!isTsdocCommentRun(run)) {
                return null;
            }

            return run.map((entry) => entry.lineText.trim()).join("\n");
        }

        /**
         * Returns true when the function body contains at least one `return <value>`
         * statement (bare `return` with no value does not count).
         *
         * @param node Lua function AST node.
         * @returns True when a value-returning return is present in the body.
         */
        function functionHasReturnValue(node) {
            if (!node.range) return false;

            const text = sourceCode.getText();
            const bodyStart = node.range[0];
            const bodyEnd = node.range[1];
            const body = text.slice(bodyStart, bodyEnd);

            // Match `return` followed by something other than end-of-statement.
            // Excludes bare `return` (followed by newline, `end`, or nothing).
            return /\breturn\s+(?!end\b)[\w"'({-]/.test(body);
        }

        /**
         * Returns true when a parameter name is a conventional unused placeholder.
         *
         * @param name Lua parameter identifier.
         * @returns True when @param documentation is not required.
         */
        function isIgnoredParamName(name) {
            return /^_{1,3}$/.test(name);
        }

        function checkFunction(node) {
            const combined = getDocBlockFromSource(node);

            if (!combined) return;

            const params = node.params ?? [];

            for (const param of params) {
                if (param.type === "Identifier") {
                    const name = param.name;

                    if (isIgnoredParamName(name)) {
                        continue;
                    }

                    if (!new RegExp(`@param\\s+${name}\\b`).test(combined)) {
                        context.report({
                            node,
                            message: `Missing @param tag for parameter "${name}".`
                        });
                    }
                }
            }

            if (!/@returns?\b/.test(combined) && functionHasReturnValue(node)) {
                context.report({
                    node,
                    message: "Missing @return tag for documented function."
                });
            }
        }

        return {
            LuaFunctionDeclaration: checkFunction
        };
    }
};
