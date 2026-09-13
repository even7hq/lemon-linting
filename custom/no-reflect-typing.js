/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow Reflect.get/set/has/deleteProperty used as a typing escape hatch",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const forbiddenMethods = new Set(["get", "set", "has", "deleteProperty"]);

        return {
            CallExpression(node) {
                const callee = node.callee;

                if (callee.type !== "MemberExpression") {
                    return;
                }

                if (callee.object.type !== "Identifier" || callee.object.name !== "Reflect") {
                    return;
                }

                if (callee.property.type !== "Identifier") {
                    return;
                }

                if (!forbiddenMethods.has(callee.property.name)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "`Reflect." + callee.property.name + "()` is forbidden for property access - " +
                        "use module augmentation, type guards, or a single centralized helper instead of Reflect at call sites."
                });
            }
        };
    }
};
