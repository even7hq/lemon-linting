/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Convert line comments before declarations into JSDoc block comments",
            category: "Style",
            recommended: true
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        const DECLARATION_TYPES = new Set([
            "VariableDeclaration",
            "FunctionDeclaration",
            "ClassDeclaration",
            "ExportNamedDeclaration",
            "ExportDefaultDeclaration",
            "TSTypeAliasDeclaration",
            "TSInterfaceDeclaration",
            "TSEnumDeclaration"
        ]);

        function getLeadingLineComments(node) {
            const tokenOrComment = sourceCode.getTokenBefore(node, { includeComments: true });

            if (!tokenOrComment || tokenOrComment.type !== "Line") {
                return [];
            }

            const run = [];
            let current = tokenOrComment;

            while (current && current.type === "Line") {
                const lineStart = sourceCode.text.lastIndexOf("\n", current.range[0] - 1) + 1;
                const textBefore = sourceCode.text.slice(lineStart, current.range[0]).trim();

                if (textBefore !== "") {
                    break;
                }

                run.unshift(current);
                current = sourceCode.getTokenBefore(current, { includeComments: true });
            }

            return run;
        }

        function hasBlankLineBetween(lastComment, declNode) {
            const between = sourceCode.text.slice(lastComment.range[1], declNode.range[0]);

            return (between.match(/\n/g) || []).length >= 2;
        }

        function check(node) {
            if (!DECLARATION_TYPES.has(node.type)) {
                return;
            }

            // Only apply at module scope — not inside functions, classes or blocks
            const ancestors = sourceCode.getAncestors(node);
            const isModuleLevel = ancestors.every((a) =>
                a.type === "Program" ||
                a.type === "ExportNamedDeclaration" ||
                a.type === "ExportDefaultDeclaration"
            );

            if (!isModuleLevel) {
                return;
            }

            const comments = getLeadingLineComments(node);

            if (comments.length === 0) {
                return;
            }

            if (hasBlankLineBetween(comments[comments.length - 1], node)) {
                return;
            }

            const before = sourceCode.getTokenBefore(comments[0], { includeComments: true });

            if (before && before.type === "Block" && before.value.startsWith("*")) {
                return;
            }

            context.report({
                node: comments[0],
                message: "Prefer a JSDoc block comment (`/** ... */`) over line comments before declarations.",
                fix(fixer) {
                    const indent = " ".repeat(comments[0].loc.start.column);
                    const lines = comments.map((c) => c.value.trim());

                    const docblock =
                        lines.length === 1
                            ? `/**\n${indent} * ${lines[0]}\n${indent} */`
                            : `/**\n${lines.map((l) => `${indent} * ${l}`).join("\n")}\n${indent} */`;

                    return fixer.replaceTextRange(
                        [comments[0].range[0], comments[comments.length - 1].range[1]],
                        docblock
                    );
                }
            });
        }

        return {
            VariableDeclaration: check,
            FunctionDeclaration: check,
            ClassDeclaration: check,
            ExportNamedDeclaration: check,
            ExportDefaultDeclaration: check,
            TSTypeAliasDeclaration: check,
            TSInterfaceDeclaration: check,
            TSEnumDeclaration: check
        };
    }
};
