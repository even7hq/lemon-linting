/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Require correct Portuguese accents in user-facing string literals",
            category: "Style",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const checks = [
            { pattern: /\bnao\b/i, fixed: "não" },
            { pattern: /\bvoce\b/i, fixed: "você" },
            { pattern: /\bconfiguracao\b/i, fixed: "configuração" },
            { pattern: /\bpermissao\b/i, fixed: "permissão" },
            { pattern: /\binformacao\b/i, fixed: "informação" },
            { pattern: /\boperacao\b/i, fixed: "operação" },
            { pattern: /\bexcecao\b/i, fixed: "exceção" }
        ];

        /**
         * Reports missing accents inside a string literal value.
         *
         * @param {import("estree").Node} node
         * @param {string} value
         */
        function checkString(node, value) {
            for (const { pattern, fixed } of checks) {
                if (!pattern.test(value)) {
                    continue;
                }

                context.report({
                    node,
                    message:
                        `Portuguese string may be missing accents (e.g. use '${fixed}') `
                        + "(rule: pt-br-acentuacao)."
                });
                return;
            }
        }

        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }

                checkString(node, node.value);
            },

            TemplateElement(node) {
                checkString(node, node.value.cooked || node.value.raw || "");
            }
        };
    }
};
