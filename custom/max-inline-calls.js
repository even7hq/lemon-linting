/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow more than N call expressions nested as arguments on the same line",
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

        return {
            CallExpression(node) {
                // Only check calls that are themselves passed as arguments to another call.
                // Method chains (callee is a MemberExpression) are intentionally readable
                // and should not count regardless of line position.
                if (!isArgumentCall(node)) {
                    return;
                }

                // Only report on the outermost argument-call in the chain (parent is not an argument-call)
                if (isArgumentCall(node.parent)) {
                    return;
                }

                // Count how deep the argument-nesting goes on this same line
                const depth = argumentNestingDepth(node);

                if (depth > max) {
                    context.report({
                        node,
                        message: `Too many nested call expressions on one line (${depth}). Maximum is ${max}. Break into multiple lines.`
                    });
                }
            }
        };
    }
};

/**
 * Returns true if this CallExpression is passed directly as an argument to another call.
 * e.g. the inner calls in `fn(g(h()))`.
 *
 * @param {import("eslint").Rule.Node} node
 * @returns {boolean}
 */
function isArgumentCall(node) {
    const parent = node.parent;

    return (
        parent?.type === "CallExpression" &&
        parent.arguments.includes(node)
    );
}

/**
 * Counts the total number of CallExpression nodes in this argument-nesting chain
 * that start on the same line, walking both up (to outermost) and down (into arguments).
 *
 * Only counts calls connected via `arguments`, not via callee (method chains).
 *
 * @param {import("eslint").Rule.Node} node
 * @returns {number}
 */
function argumentNestingDepth(node) {
    // Walk up to the outermost call in this argument chain on the same line
    let root = node;
    const line = node.loc.start.line;

    while (
        root.parent?.type === "CallExpression" &&
        root.parent.arguments.includes(root) &&
        root.parent.loc.start.line === line
    ) {
        root = root.parent;
    }

    // Count all calls reachable via arguments from root, on the same line
    return countArgumentCalls(root, line);
}

/**
 * Recursively counts CallExpression nodes reachable via arguments on the given line.
 *
 * @param {import("eslint").Rule.Node} node
 * @param {number} line
 * @returns {number}
 */
function countArgumentCalls(node, line) {
    if (node.type !== "CallExpression" || node.loc.start.line !== line) {
        return 0;
    }

    let count = 1;

    for (const arg of node.arguments) {
        count += countArgumentCalls(arg, line);
    }

    return count;
}
