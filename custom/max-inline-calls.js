/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow more than N call expressions starting on the same line",
            category: "Style",
            recommended: true
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1, default: 3 }
                },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const max = context.options[0]?.max ?? 3;

        // line → Set of outermost CallExpression nodes on that line
        /** @type {Map<number, import("eslint").Rule.Node[]>} */
        const callsByLine = new Map();

        // Track which nodes are nested inside another CallExpression
        const nestedCalls = new Set();

        return {
            CallExpression(node) {
                const line = node.loc.start.line;

                if (!callsByLine.has(line)) {
                    callsByLine.set(line, []);
                }

                callsByLine.get(line).push(node);

                // Mark all descendant CallExpressions as nested
                markNestedCalls(node, nestedCalls);
            },

            "Program:exit"() {
                for (const [, calls] of callsByLine) {
                    // Count all calls on this line (including nested ones)
                    if (calls.length <= max) {
                        continue;
                    }

                    // Report the outermost call on the line (not nested in another call on same line)
                    const outermost = calls.find((n) => !nestedCalls.has(n)) ?? calls[0];

                    context.report({
                        node: outermost,
                        message: `Too many call expressions on one line (${calls.length}). Maximum is ${max}. Break the chain across multiple lines.`
                    });
                }
            }
        };
    }
};

/**
 * Marks all CallExpression descendants of node as nested.
 *
 * @param {import("eslint").Rule.Node} node
 * @param {Set<import("eslint").Rule.Node>} nested
 */
function markNestedCalls(node, nested) {
    function walk(n) {
        if (!n || typeof n !== "object") {
            return;
        }

        for (const key of Object.keys(n)) {
            if (key === "parent") {
                continue;
            }

            const child = n[key];

            if (Array.isArray(child)) {
                for (const item of child) {
                    if (item && item.type === "CallExpression" && item !== node) {
                        nested.add(item);
                    }

                    walk(item);
                }
            }
 else if (child && child.type) {
                if (child.type === "CallExpression" && child !== node) {
                    nested.add(child);
                }

                walk(child);
            }
        }
    }

    walk(node);
}
