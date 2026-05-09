/** @type {import("eslint").Rule.RuleModule} */
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

        function getDocBlock(node) {
            const comments = sourceCode.getCommentsBefore(node);
            if (!comments.length) return null;

            // Collect the unbroken run of Line comments immediately before the node.
            const block = [];

            for (let i = comments.length - 1; i >= 0; i--) {
                const c = comments[i];

                if (c.type !== "Line") break;

                block.unshift(c);
            }

            if (!block.length) return null;

            // Only treat as a doc block when it contains at least one @tag.
            const hasTag = block.some((c) => /@param\b|@returns?\b|@throws?\b/.test(c.raw));

            if (!hasTag) return null;

            return block;
        }

        function checkFunction(node, block) {
            if (!block) return;

            // Merge all comment raws into a single string for tag searching.
            const combined = block.map((c) => c.raw).join("\n");
            const params = node.params ?? [];

            for (const param of params) {
                if (param.type === "Identifier") {
                    const name = param.name;

                    if (!new RegExp(`@param\\s+${name}\\b`).test(combined)) {
                        context.report({
                            node,
                            message: `Missing @param tag for parameter "${name}".`
                        });
                    }
                }
            }

            if (!/@returns?\b/.test(combined)) {
                context.report({
                    node,
                    message: "Missing @return tag for documented function."
                });
            }
        }

        return {
            LuaFunctionDeclaration(node) {
                const block = getDocBlock(node);

                if (block) {
                    checkFunction(node, block);
                }
            }
        };
    }
};
