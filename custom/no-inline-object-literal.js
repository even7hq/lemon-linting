/**
 * Disallows inline object literals except empty objects or up to N shorthand-only properties.
 */

/**
 * @param {import("estree").Property | import("estree").SpreadElement} prop Object literal member.
 * @returns {boolean} True when the member is a simple shorthand property.
 */
function isShorthandProperty(prop) {
    return (
        prop.type === "Property" &&
        prop.shorthand === true &&
        prop.kind === "init" &&
        prop.method !== true
    );
}

/**
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @param {number} maxShorthandProperties Maximum shorthand properties allowed.
 * @returns {boolean} True when the literal is allowed inline.
 */
function isAllowedInlineObject(node, maxShorthandProperties) {
    const properties = node.properties;

    if (properties.length === 0) {
        return true;
    }

    if (properties.length > maxShorthandProperties) {
        return false;
    }

    return properties.every(isShorthandProperty);
}

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow inline object literals except empty objects or small shorthand-only objects",
            category: "Style",
            recommended: true
        },

        schema: [
            {
                type: "object",
                properties: {
                    maxShorthandProperties: {
                        type: "integer",
                        minimum: 1,
                        default: 2
                    }
                },

                additionalProperties: false
            }
        ]
    },

    create(context) {
        const maxShorthandProperties = context.options[0]?.maxShorthandProperties ?? 2;

        return {
            ObjectExpression(node) {
                if (isAllowedInlineObject(node, maxShorthandProperties)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "Inline object literals are not allowed. Build a typed object with property assignments, or use at most {{max}} shorthand properties (e.g. `{ name, tel }`).",

                    data: {
                        max: String(maxShorthandProperties)
                    }
                });
            }
        };
    }
};

module.exports.isAllowedInlineObject = isAllowedInlineObject;
