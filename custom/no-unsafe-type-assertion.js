/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow unsafe type assertions (as any, as unknown, as unknown as T)",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            TSAsExpression(node) {
                const typeAnnotation = node.typeAnnotation;

                if (!typeAnnotation) {
                    return;
                }

                if (typeAnnotation.type === "TSAnyKeyword") {
                    context.report({
                        node,
                        message: "Unsafe `as any` assertion - use guards, augmentation, or proper types."
                    });
                    return;
                }

                if (typeAnnotation.type === "TSUnknownKeyword") {
                    context.report({
                        node,
                        message: "Unsafe `as unknown` assertion - use guards, augmentation, or proper types."
                    });
                }
            }
        };
    }
};
