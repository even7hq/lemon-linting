/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce newlines for blocks in Lua",
            category: "Stylistic Issues",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function checkBlock(node, body, keyword, endNode) {
            if (!body || body.length === 0) return;

            const firstStatement = body[0];
            const lastStatement = body[body.length - 1];

            if (node.loc.start.line === firstStatement.loc.start.line) {
                context.report({
                    node: firstStatement,
                    message: `Block body must start on a new line after ${keyword}.`,
                    fix(fixer) {
                        return fixer.insertTextBefore(firstStatement, "\n");
                    }
                });
            }

            if (endNode && endNode.loc.end.line === lastStatement.loc.end.line) {
                context.report({
                    node: lastStatement,
                    message: `Block end must be on a new line.`,
                    fix(fixer) {
                        return fixer.insertTextAfter(lastStatement, "\n");
                    }
                });
            }
        }

        return {
            IfClause(node) {
                checkBlock(node, node.body, "then", null);
            },
            ElseifClause(node) {
                checkBlock(node, node.body, "then", null);
            },
            ElseClause(node) {
                checkBlock(node, node.body, "else", null);
            },
            LuaIfStatement(node) {
                const lastClause = node.clauses[node.clauses.length - 1];
                if (lastClause.body && lastClause.body.length > 0) {
                    const lastStatement = lastClause.body[lastClause.body.length - 1];
                    if (node.loc.end.line === lastStatement.loc.end.line) {
                        context.report({
                            node: lastStatement,
                            message: "Block end must be on a new line.",
                            fix(fixer) {
                                return fixer.insertTextAfter(lastStatement, "\n");
                            }
                        });
                    }
                }
            },
            LuaWhileStatement(node) {
                checkBlock(node, node.body, "do", node);
            },
            LuaDoStatement(node) {
                checkBlock(node, node.body, "do", node);
            },
            RepeatStatement(node) {
                checkBlock(node, node.body, "repeat", node);
            },
            LuaForNumericStatement(node) {
                checkBlock(node, node.body, "do", node);
            },
            LuaForGenericStatement(node) {
                checkBlock(node, node.body, "do", node);
            },
            LuaFunctionDeclaration(node) {
                checkBlock(node, node.body, "function", node);
            }
        };
    }
};
