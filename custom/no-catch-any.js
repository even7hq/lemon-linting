/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow catch (err: any) - narrow with unknown and type guards",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            CatchClause(node) {
                const param = node.param;

                if (!param || param.type !== "Identifier") {
                    return;
                }

                if (param.typeAnnotation?.typeAnnotation?.type === "TSAnyKeyword") {
                    context.report({
                        node: param,
                        message: "`catch (err: any)` is forbidden - use `catch (err)` and narrow with instanceof."
                    });
                }
            }
        };
    }
};
