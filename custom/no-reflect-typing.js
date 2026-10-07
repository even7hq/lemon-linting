/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        fixable: "code",
        docs: {
            description: "Disallow Reflect.get/set/has/deleteProperty used as a typing escape hatch",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const forbiddenMethods = new Set(["get", "set", "has", "deleteProperty"]);
        const sourceCode = context.sourceCode;

        /**
         * Reads a string literal argument when the expression is a plain literal or template.
         *
         * @param {import("estree").Node} node Argument expression.
         * @returns {string | null} String value when statically known.
         */
        function getStringLiteralValue(node) {
            if (node.type === "Literal" && typeof node.value === "string") {
                return node.value;
            }

            if (
                node.type === "TemplateLiteral" &&
                node.expressions.length === 0 &&
                node.quasis.length === 1
            ) {
                return node.quasis[0].value.cooked;
            }

            return null;
        }

        /**
         * Builds member or bracket access for a property key.
         *
         * @param {string} objectText Receiver source text.
         * @param {import("estree").Node} keyNode Key expression node.
         * @param {string} keyValue Decoded key string.
         * @returns {string} Access expression text.
         */
        function buildPropertyAccess(objectText, keyNode, keyValue) {
            const isIdentifierKey = /^[A-Za-z_$][\w$]*$/.test(keyValue);

            if (isIdentifierKey) {
                return `${objectText}.${keyValue}`;
            }

            return `${objectText}[${sourceCode.getText(keyNode)}]`;
        }

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

                const method = callee.property.name;

                if (!forbiddenMethods.has(method)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "`Reflect." + method + "()` is forbidden for property access - " +
                        "use module augmentation, type guards, or a single centralized helper instead of Reflect at call sites.",
                    fix(fixer) {
                        const args = node.arguments;

                        if (args.length < 2) {
                            return null;
                        }

                        const targetText = sourceCode.getText(args[0]);
                        const keyValue = getStringLiteralValue(args[1]);

                        if (keyValue === null) {
                            return null;
                        }

                        const keyText = sourceCode.getText(args[1]);
                        const access = buildPropertyAccess(targetText, args[1], keyValue);

                        if (method === "get") {
                            return fixer.replaceText(node, access);
                        }

                        if (method === "set" && args.length >= 3) {
                            const valueText = sourceCode.getText(args[2]);

                            return fixer.replaceText(node, `${access} = ${valueText}`);
                        }

                        if (method === "has") {
                            return fixer.replaceText(node, `${keyText} in ${targetText}`);
                        }

                        if (method === "deleteProperty") {
                            return fixer.replaceText(node, `delete ${access}`);
                        }

                        return null;
                    }
                });
            }
        };
    }
};
