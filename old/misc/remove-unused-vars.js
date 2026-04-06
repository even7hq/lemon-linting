/**
 * Autofixable rule: reports unused variables, types, interfaces and enums,
 * and removes the entire declaration when the fix is applied.
 *
 * Covers:
 *   - const/let/var declarations (def.type === "Variable")
 *   - type aliases       (def.type === "TSTypeAliasDeclaration" / node.type)
 *   - interfaces         (def.type === "TSInterfaceDeclaration" / node.type)
 *   - enums              (def.type === "TSEnumDeclaration" / node.type)
 */

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
        const options = context.options[0] || {};
        const ignorePattern = options.varsIgnorePattern ? new RegExp(options.varsIgnorePattern) : /^_/;

        /**
         * Returns true when the given AST node is directly inside an export declaration.
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isExported(node) {
            const parent = node.parent;

            return (
                parent &&
                (parent.type === "ExportNamedDeclaration" ||
                    parent.type === "ExportDefaultDeclaration")
            );
        }

        /**
         * Removes the full declaration statement including the trailing newline.
         *
         * @param {import("eslint").Rule.RuleFixer} fixer
         * @param {import("eslint").Rule.Node} declNode - The top-level declaration node.
         * @returns {import("eslint").Rule.Fix}
         */
        function removeDeclaration(fixer, declNode) {
            const sourceCode = context.getSourceCode();

            // If wrapped in export, remove the export too
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
            "Program:exit"() {
                walkScope(context.getScope(), (variable) => {
                    const name = variable.name;

                    if (ignorePattern.test(name)) {
                        return;
                    }

                    if (variable.defs.length === 0) {
                        return;
                    }

                    // Has any read reference — it IS used
                    if (variable.references.some((ref) => ref.isRead())) {
                        return;
                    }

                    const def = variable.defs[0];
                    const defNode = def.node;

                    // ── Variable (const/let/var) ──────────────────────────────────────
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
                                const sourceCode = context.getSourceCode();

                                if (declaration.declarations.length === 1) {
                                    return removeDeclaration(fixer, declaration);
                                }

                                return fixer.remove(declarator);
                            }
                        });

                        return;
                    }

                    // ── Type alias / Interface / Enum ─────────────────────────────────
                    // @typescript-eslint/parser uses:
                    //   def.type === "Type"        for type aliases and interfaces
                    //   def.type === "TSEnumName"  for enums
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

/**
 * @param {import("eslint").Scope.Scope} scope
 * @param {(v: import("eslint").Scope.Variable) => void} fn
 */
function walkScope(scope, fn) {
    for (const variable of scope.variables) {
        fn(variable);
    }

    for (const child of scope.childScopes) {
        walkScope(child, fn);
    }
}
