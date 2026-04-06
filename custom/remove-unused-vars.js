/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Remove unused variable, type, interface and enum declarations (autofixable)",
            category: "Variables",
            recommended: true
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    varsIgnorePattern: { type: "string" },
                    argsIgnorePattern: { type: "string" }
                },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const options = context.options[0] || {};
        const ignorePattern = options.varsIgnorePattern ? new RegExp(options.varsIgnorePattern) : /^_/;

        function isExported(node) {
            const parent = node.parent;

            return (
                parent &&
                (parent.type === "ExportNamedDeclaration" ||
                    parent.type === "ExportDefaultDeclaration")
            );
        }

        function removeDeclaration(fixer, declNode) {
            const target =
                declNode.parent &&
                (declNode.parent.type === "ExportNamedDeclaration" ||
                    declNode.parent.type === "ExportDefaultDeclaration")
                    ? declNode.parent
                    : declNode;

            const end = sourceCode.text.indexOf("\n", target.range[1]);

            return fixer.removeRange([target.range[0], end >= 0 ? end + 1 : target.range[1]]);
        }

        return {
            "Program:exit"(program) {
                const scope = sourceCode.getScope(program);

                walkScope(scope, (variable) => {
                    const name = variable.name;

                    if (ignorePattern.test(name)) {
                        return;
                    }

                    if (variable.defs.length === 0) {
                        return;
                    }

                    if (variable.references.some((ref) => ref.isRead())) {
                        return;
                    }

                    const def = variable.defs[0];
                    const defNode = def.node;

                    if (def.type === "Variable") {
                        const declarator = defNode;
                        const declaration = declarator.parent;

                        if (isExported(declaration)) {
                            return;
                        }

                        const idNode = def.name;

                        if (!idNode || idNode.type !== "Identifier") {
                            return;
                        }

                        context.report({
                            node: idNode,
                            message: `'${name}' is assigned a value but never used.`,
                            fix(fixer) {
                                if (declaration.declarations.length === 1) {
                                    return removeDeclaration(fixer, declaration);
                                }

                                return fixer.remove(declarator);
                            }
                        });

                        return;
                    }

                    const isTsType = def.type === "Type" || def.type === "TSEnumName";

                    if (!isTsType) {
                        return;
                    }

                    const declNode = defNode;

                    if (isExported(declNode)) {
                        return;
                    }

                    const nodeType = declNode.type || "";
                    const kindLabel =
                        nodeType === "TSTypeAliasDeclaration"
                            ? "type"
                            : nodeType === "TSInterfaceDeclaration"
                                ? "interface"
                                : "enum";

                    context.report({
                        node: def.name,
                        message: `${kindLabel} '${name}' is declared but never used.`,
                        fix: (fixer) => removeDeclaration(fixer, declNode)
                    });
                });
            }
        };
    }
};

function walkScope(scope, fn) {
    for (const variable of scope.variables) {
        fn(variable);
    }

    for (const child of scope.childScopes) {
        walkScope(child, fn);
    }
}
