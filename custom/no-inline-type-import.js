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
        docs: {
            description: "Disallow inline import() expressions used as type annotations — use top-level `import type` instead",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            TSImportType(node) {
                context.report({
                    node,
                    message: "Avoid inline `import(\"...\")` type expressions. Use a top-level `import type { ... } from \"...\"` instead."
                });
            }
        };
    }
};
