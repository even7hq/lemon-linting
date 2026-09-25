/**
 * Shared policy for local/no-inline-object-literal (ESTree and TypeScript codemod).
 */

/**
 * Method names whose second argument is declarative CLI/schema config (yargs, etc.).
 */
const CLI_BUILDER_METHOD_NAMES = new Set([
    "positional",
    "option",
    "options",
    "config",
    "command",
    "commands",
    "middleware",
    "parserConfiguration",
    "pkgConf",
    "env"
]);

/**
 * Reads the property name from a non-computed member call expression.
 *
 * @param callee Call callee.
 * @returns Method name when the callee is a simple member call.
 */
function getCallMemberName(callee) {
    if (callee.type === "MemberExpression" && !callee.computed) {
        const property = callee.property;

        if (property.type === "Identifier") {
            return property.name;
        }

        if (property.type === "Literal" && typeof property.value === "string") {
            return property.value;
        }
    }

    return null;
}

/**
 * Returns true when an object literal is a declarative CLI/schema config argument.
 *
 * @param {readonly unknown[]} callArguments Call expression arguments.
 * @param {unknown} argumentNode Object literal node.
 * @param {string | null} methodName Callee member name (e.g. option, positional).
 * @returns {boolean} True when the literal is exempt from the inline-object policy.
 */
function isDeclarativeConfigObjectLiteralForArgument(callArguments, argumentNode, methodName) {
    if (!callArguments || !callArguments.includes(argumentNode)) {
        return false;
    }

    if (!methodName) {
        return false;
    }

    return CLI_BUILDER_METHOD_NAMES.has(methodName);
}

/**
 * Returns true for inline objects passed to CLI builder APIs (not domain DTOs).
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when the literal is exempt from the inline-object policy.
 */
function isDeclarativeConfigObjectLiteral(node) {
    const parent = node.parent;

    if (!parent || parent.type !== "CallExpression") {
        return false;
    }

    const methodName = getCallMemberName(parent.callee);

    return isDeclarativeConfigObjectLiteralForArgument(parent.arguments, node, methodName);
}

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
    CLI_BUILDER_METHOD_NAMES,
    isShorthandProperty,
    isViolatingInlineObjectLiteral,
    isDeclarativeConfigObjectLiteral,
    isDeclarativeConfigObjectLiteralForArgument
};
