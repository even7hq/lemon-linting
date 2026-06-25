/**
 * @type {import("eslint").Rule.RuleModule}
 */
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

        /**
         * Returns true when the scope entry is the key name of a mapped type (`[K in T]`).
         *
         * @param declNode ESLint definition node.
         * @param def ESLint variable definition metadata.
         * @returns True when the name is a mapped-type iterator, not a real unused enum.
         */
        function isMappedTypeKeyParameter(declNode, def) {
            if (def.type !== "Type" && def.type !== "TSEnumName") {
                return false;
            }

            if (declNode.type === "TSTypeParameter" && declNode.parent?.type === "TSMappedType") {
                return true;
            }

            const nameNode = declNode.type === "Identifier" ? declNode : def.name;

            return (
                nameNode?.type === "Identifier" &&
                nameNode.parent?.type === "TSTypeParameter" &&
                nameNode.parent.parent?.type === "TSMappedType"
            );
        }

        function isInsideModuleAugmentation(node) {
            let current = node;

            while (current) {
                // Check if we're inside a TSModuleDeclaration with a string name (declare module "...")
                if (
                    current.type === "TSModuleDeclaration" &&
                    current.id &&
                    current.id.type === "Literal" &&
                    typeof current.id.value === "string"
                ) {
                    return true;
                }

                current = current.parent;
            }

            return false;
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

                        // Check if the variable is part of a destructuring pattern.
                        // In that case, remove only the specific property from the pattern,
                        // not the entire declarator or declaration.
                        const pattern = declarator.id;
                        const isDestructured =
                            pattern &&
                            (pattern.type === "ObjectPattern" || pattern.type === "ArrayPattern");

                        context.report({
                            node: idNode,
                            message: `'${name}' is assigned a value but never used.`,
                            fix(fixer) {
                                if (isDestructured && pattern.type === "ObjectPattern") {
                                    // Find the specific property in the destructuring pattern.
                                    const prop = pattern.properties.find((p) => {
                                        if (p.type === "RestElement") return false;
                                        const val = p.value;

                                        return (
                                            (val && val.type === "Identifier" && val.name === name) ||
                                            (val && val.type === "AssignmentPattern" && val.left.type === "Identifier" && val.left.name === name) ||
                                            (p.shorthand && p.key && p.key.name === name)
                                        );
                                    });

                                    if (!prop) return null;

                                    // If it's the only property, remove the whole declaration.
                                    if (pattern.properties.length === 1) {
                                        return removeDeclaration(fixer, declaration);
                                    }

                                    // Otherwise remove just this property (and its trailing/leading comma).
                                    const propIdx = pattern.properties.indexOf(prop);
                                    const isLast = propIdx === pattern.properties.length - 1;
                                    const tokenAfter = sourceCode.getTokenAfter(prop);
                                    const tokenBefore = sourceCode.getTokenBefore(prop);

                                    if (isLast && tokenBefore && tokenBefore.value === ",") {
                                        // Remove the preceding comma and the property.
                                        return fixer.removeRange([tokenBefore.range[0], prop.range[1]]);
                                    }

                                    if (!isLast && tokenAfter && tokenAfter.value === ",") {
                                        // Remove the property and the following comma (and any whitespace).
                                        const nextToken = sourceCode.getTokenAfter(tokenAfter);
                                        const endPos = nextToken ? nextToken.range[0] : tokenAfter.range[1];

                                        return fixer.removeRange([prop.range[0], endPos]);
                                    }

                                    return fixer.remove(prop);
                                }

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

                    if (isMappedTypeKeyParameter(declNode, def)) {
                        return;
                    }

                    // Skip type parameters used in mapped types: `[S in Stage]` -
                    // `S` is a type parameter of TSMappedType, not an unused declaration.
                    if (
                        declNode.type === "TSTypeParameter" &&
                        declNode.parent?.type === "TSMappedType"
                    ) {
                        return;
                    }

                    // Skip any type parameter (generic) - they are always "used" implicitly
                    // by the type system even when ESLint's scope analysis can't see the usage.
                    if (declNode.type === "TSTypeParameter") {
                        return;
                    }

                    if (isExported(declNode)) {
                        return;
                    }

                    // Skip interfaces/types inside module augmentations (declare module "...")
                    if (isInsideModuleAugmentation(declNode)) {
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
