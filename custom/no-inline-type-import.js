/**
 * Disallows inline `import("...").Type` expressions used as type annotations.
 *
 * Instead of:
 *   const x = foo() as import("./Bar").Bar;
 *   function f(x: import("./Bar").Bar) {}
 *
 * Use a top-level import:
 *   import type { Bar } from "./Bar";
 *   const x = foo() as Bar;
 *   function f(x: Bar) {}
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow inline import() expressions used as type annotations - use top-level `import type` instead",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;
        /** @type {import("@typescript-eslint/types").TSESTree.TSImportType[]} */
        const pendingImportTypes = [];

        /**
         * Builds a stable namespace alias from a module specifier.
         *
         * @param {string} specifier Module path.
         * @returns {string} Valid TypeScript identifier.
         */
        function moduleSpecifierToNamespaceAlias(specifier) {
            let name = specifier
                .replace(/^@\//, "")
                .replace(/\//g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "_")
                .replace(/_+/g, "_")
                .replace(/^_|_$/g, "");

            if (name.length === 0) {
                name = "module";
            }

            if (!/^[A-Za-z_$]/.test(name)) {
                name = `_${name}`;
            }

            return `${name}Module`;
        }

        /**
         * Reads the exported name from a TSImportType qualifier.
         *
         * @param {import("@typescript-eslint/types").TSESTree.EntityName} qualifier Qualifier node.
         * @returns {string | null} Identifier name when present.
         */
        function getQualifierName(qualifier) {
            if (qualifier.type === "Identifier") {
                return qualifier.name;
            }

            if (qualifier.type === "TSQualifiedName" && qualifier.right.type === "Identifier") {
                return qualifier.right.name;
            }

            return null;
        }

        /**
         * Returns the end offset after the last top-level import, or 0 when none.
         *
         * @returns {number} Insert position for new import lines.
         */
        function getImportInsertOffset() {
            const program = sourceCode.ast;
            let end = 0;

            for (const stmt of program.body) {
                if (stmt.type === "ImportDeclaration") {
                    end = stmt.range[1];
                } else if (end > 0) {
                    break;
                }
            }

            return end;
        }

        /**
         * Returns true when a namespace type import for the specifier already exists.
         *
         * @param {string} specifier Module path.
         * @returns {boolean} True when present.
         */
        function hasNamespaceTypeImport(specifier) {
            for (const stmt of sourceCode.ast.body) {
                if (stmt.type !== "ImportDeclaration") {
                    continue;
                }

                if (stmt.importKind !== "type" && stmt.importKind !== "typeof") {
                    continue;
                }

                if (stmt.source.value !== specifier) {
                    continue;
                }

                if (stmt.specifiers.some((spec) => spec.type === "ImportNamespaceSpecifier")) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Returns true when a named type import for the specifier and symbol already exists.
         *
         * @param {string} specifier Module path.
         * @param {string} symbol Imported type name.
         * @returns {boolean} True when present.
         */
        function hasNamedTypeImport(specifier, symbol) {
            for (const stmt of sourceCode.ast.body) {
                if (stmt.type !== "ImportDeclaration") {
                    continue;
                }

                if (stmt.importKind !== "type" && stmt.importKind !== "typeof") {
                    continue;
                }

                if (stmt.source.value !== specifier) {
                    continue;
                }

                for (const spec of stmt.specifiers) {
                    if (spec.type === "ImportSpecifier" && spec.imported.name === symbol) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Reads the module specifier from a TSImportType argument node.
         *
         * @param {import("@typescript-eslint/types").TSESTree.TypeNode} argument Import path node.
         * @returns {string | null} Module path when statically known.
         */
        function getModuleSpecifier(argument) {
            if (argument.type === "Literal" && typeof argument.value === "string") {
                return argument.value;
            }

            if (
                argument.type === "TSLiteralType" &&
                argument.literal.type === "Literal" &&
                typeof argument.literal.value === "string"
            ) {
                return argument.literal.value;
            }

            return null;
        }

        /**
         * Resolves replacement identifier text and optional import line for a TSImportType.
         *
         * @param {import("@typescript-eslint/types").TSESTree.TSImportType} node Import type node.
         * @returns {{ replacement: string | null, importLine: string | null }} Fix target and import to add.
         */
        function resolveImportTypeFix(node) {
            const specifier = getModuleSpecifier(node.argument);

            if (specifier === null) {
                return { replacement: null, importLine: null };
            }

            const qualifierName = node.qualifier ? getQualifierName(node.qualifier) : null;

            if (qualifierName) {
                const importLine = hasNamedTypeImport(specifier, qualifierName)
                    ? null
                    : `import type { ${qualifierName} } from "${specifier}";`;

                return {
                    replacement: qualifierName,
                    importLine
                };
            }

            const alias = moduleSpecifierToNamespaceAlias(specifier);
            const importLine = hasNamespaceTypeImport(specifier)
                ? null
                : `import type * as ${alias} from "${specifier}";`;

            return {
                replacement: alias,
                importLine
            };
        }

        /**
         * Builds fixer edits for every inline import type in the file.
         *
         * @param {import("eslint").Rule.RuleFixer} fixer ESLint fixer.
         * @returns {import("eslint").Rule.Fix[]} Combined fixes.
         */
        function buildFixesForAllPending(fixer) {
            const fixes = [];
            const importLines = [];
            const seenImportLines = new Set();

            for (const node of pendingImportTypes) {
                const { replacement, importLine } = resolveImportTypeFix(node);

                if (replacement) {
                    fixes.push(fixer.replaceText(node, replacement));
                }

                if (importLine && !seenImportLines.has(importLine)) {
                    seenImportLines.add(importLine);
                    importLines.push(importLine);
                }
            }

            if (importLines.length > 0) {
                const insertAt = getImportInsertOffset();
                const leading = insertAt === 0 ? "" : "\n";
                const trailing = "\n";
                const block = `${leading}${importLines.join("\n")}${trailing}`;

                fixes.push(fixer.insertTextAfterRange([insertAt, insertAt], block));
            }

            return fixes;
        }

        return {
            TSImportType(node) {
                pendingImportTypes.push(node);
            },

            "Program:exit"() {
                if (pendingImportTypes.length === 0) {
                    return;
                }

                for (let index = 0; index < pendingImportTypes.length; index++) {
                    const node = pendingImportTypes[index];
                    const report = {
                        node,
                        message: "Avoid inline `import(\"...\")` type expressions. Use a top-level `import type { ... } from \"...\"` instead."
                    };

                    if (index === 0) {
                        report.fix = buildFixesForAllPending;
                    }

                    context.report(report);
                }
            }
        };
    }
};
