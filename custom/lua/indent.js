/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce consistent indentation in Lua",
            category: "Stylistic Issues",
            recommended: true
        },
        fixable: "whitespace",
        schema: [
            {
                type: "integer",
                minimum: 0
            }
        ]
    },

    create(context) {
        const indentSize = context.options[0] || 4;
        const sourceCode = context.sourceCode;

        function checkIndent(node, expectedIndent) {
            const column = node.loc.start.column;
            const lineIndex = node.loc.start.line - 1;
            const line = sourceCode.lines[lineIndex];
            
            // Check if there is only whitespace before the node on the same line
            const prefix = line.slice(0, column);
            if (!/^\s*$/.test(prefix)) {
                return;
            }

            if (column !== expectedIndent) {
                context.report({
                    node,
                    message: `Expected indentation of ${expectedIndent} spaces but found ${column}.`,
                    fix(fixer) {
                        const startOfLine = sourceCode.getIndexFromLoc({ line: node.loc.start.line, column: 0 });
                        const startOfNode = sourceCode.getIndexFromLoc({ line: node.loc.start.line, column: column });
                        return fixer.replaceTextRange([startOfLine, startOfNode], " ".repeat(expectedIndent));
                    }
                });
            }
        }

        function checkBlock(body, parentIndent) {
            const expectedBodyIndent = parentIndent + indentSize;
            for (const statement of body) {
                checkIndent(statement, expectedBodyIndent);
            }
        }

        return {
            Program(node) {
                for (const statement of node.body) {
                    checkIndent(statement, 0);
                }
            },
            IfClause(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            ElseifClause(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            ElseClause(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            LuaWhileStatement(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            LuaDoStatement(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            RepeatStatement(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            LuaForNumericStatement(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            LuaForGenericStatement(node) {
                checkBlock(node.body, node.loc.start.column);
            },
            LuaFunctionDeclaration(node) {
                checkBlock(node.body, node.loc.start.column);
            }
        };
    }
};
