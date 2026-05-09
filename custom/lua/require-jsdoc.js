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

        function getJsDocComment(node) {
            const comments = sourceCode.getCommentsBefore(node);
            for (let i = comments.length - 1; i >= 0; i--) {
                const comment = comments[i];
                if (comment.raw.startsWith("---") || (comment.raw.startsWith("--[[") && comment.value.startsWith("*"))) {
                    return comment;
                }
            }
            return null;
        }

        function getTagNames(commentValue) {
            const tagPattern = /@(\w+)/g;
            const tags = new Set();
            let match;
            while ((match = tagPattern.exec(commentValue)) !== null) {
                tags.add(match[1]);
            }
            return tags;
        }

        function checkFunction(node, commentNode) {
            if (!commentNode) return;

            const commentValue = commentNode.value;
            const tags = getTagNames(commentValue);
            const params = node.params ?? [];

            for (const param of params) {
                if (param.type === "Identifier") {
                    const name = param.name;
                    const hasTag = new RegExp(`@param\\s+${name}\\b`).test(commentValue);
                    if (!hasTag) {
                        context.report({
                            node: commentNode,
                            message: `Missing @param tag for parameter "${name}".`
                        });
                    }
                }
            }

            if (!tags.has("returns") && !tags.has("return")) {
                context.report({
                    node: commentNode,
                    message: "Missing @return tag for documented function."
                });
            }
        }

        return {
            LuaFunctionDeclaration(node) {
                const commentNode = getJsDocComment(node);
                if (commentNode) {
                    checkFunction(node, commentNode);
                }
            }
        };
    }
};
