/**
 * Shared policy for local/no-inline-object-literal (ESTree and TypeScript codemod).
 */

/**
 * Returns whether an object literal member is shorthand-only.
 *
 * @param prop Object literal member.
 * @returns True when the member is a simple shorthand property.
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
 * Returns whether an object literal must be rewritten by the codemod.
 *
 * @param properties Object members.
 * @param maxShorthandProperties Maximum shorthand-only properties allowed inline.
 * @returns True when the object literal violates the inline policy.
 */
function isViolatingInlineObjectLiteral(properties, maxShorthandProperties) {
    if (properties.length === 0) {
        return false;
    }

    if (properties.length > maxShorthandProperties) {
        return true;
    }

    return !properties.every(isShorthandProperty);
}

module.exports = {
    isShorthandProperty,
    isViolatingInlineObjectLiteral
};
