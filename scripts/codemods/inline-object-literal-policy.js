/**
 * Shared policy for local/no-inline-object-literal (ESTree and TypeScript codemod).
 */

/**
 * Method names whose second argument is declarative CLI/schema config (yargs, etc.).
 */
/**
 * Sequelize-style model methods whose first argument is a query/options object.
 */
const ORM_QUERY_METHOD_NAMES = new Set([
    "findOne",
    "findAll",
    "findByPk",
    "findOrCreate",
    "findAndCountAll",
    "create",
    "bulkCreate",
    "update",
    "destroy",
    "upsert",
    "count",
    "max",
    "min",
    "sum"
]);

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
 * Returns the Vue Options API root object when node lives under export default or defineComponent.
 *
 * @param {import("estree").Node} node Object literal or any descendant.
 * @returns {import("estree").ObjectExpression | null} Root options object.
 */
function getVueComponentOptionsRoot(node) {
    let current = node;

    while (current) {
        if (current.type === "ExportDefaultDeclaration") {
            const decl = current.declaration;

            if (decl?.type === "ObjectExpression") {
                return decl;
            }

            if (
                decl?.type === "CallExpression" &&
                decl.callee?.type === "Identifier" &&
                decl.callee.name === "defineComponent" &&
                decl.arguments[0]?.type === "ObjectExpression"
            ) {
                return decl.arguments[0];
            }
        }

        if (
            current.type === "CallExpression" &&
            current.callee?.type === "Identifier" &&
            current.callee.name === "defineComponent" &&
            current.arguments[0]?.type === "ObjectExpression"
        ) {
            return current.arguments[0];
        }

        current = current.parent;
    }

    return null;
}

/**
 * Returns true when node is the Vue component options object or nested inside it.
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when the literal is component definition config, not a domain DTO.
 */
/**
 * Returns true when ancestor contains node in the AST parent chain.
 *
 * @param {import("estree").Node} ancestor Possible ancestor.
 * @param {import("estree").Node} node Descendant candidate.
 * @returns {boolean} True when ancestor contains node.
 */
function isNodeUnderAncestor(ancestor, node) {
    let current = node;

    while (current) {
        if (current === ancestor) {
            return true;
        }

        current = current.parent;
    }

    return false;
}

/**
 * Returns true when value is a string literal property value.
 *
 * @param {import("estree").Expression | import("estree").Pattern} value Property value.
 * @returns {boolean} True for string literals.
 */
function isStaticStringLiteralValue(value) {
    return value.type === "Literal" && typeof value.value === "string";
}

/**
 * Returns true for fixed string-to-string lookup tables (API catalogs, labels).
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when every property maps a string key to a string literal.
 */
function isStaticStringMapObjectLiteral(node) {
    if (node.properties.length === 0) {
        return false;
    }

    for (const prop of node.properties) {
        if (prop.type !== "Property" || prop.method || prop.kind !== "init") {
            return false;
        }

        if (!isStaticStringLiteralValue(prop.value)) {
            return false;
        }
    }

    return true;
}

/**
 * Returns true when call is Model.findOne(...) or similar Sequelize API.
 *
 * @param {import("estree").CallExpression} callExpression ORM call.
 * @returns {boolean} True for known query methods.
 */
function isOrmModelQueryCall(callExpression) {
    const methodName = getCallMemberName(callExpression.callee);

    if (!methodName) {
        return false;
    }

    return ORM_QUERY_METHOD_NAMES.has(methodName);
}

/**
 * Returns true for query/options objects passed to Sequelize model methods.
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when nested in findOne/create options.
 */
function isOrmQueryConfigObjectLiteral(node) {
    let current = node;

    while (current) {
        const parent = current.parent;

        if (parent?.type === "CallExpression" && isOrmModelQueryCall(parent)) {
            const options = parent.arguments[0];

            if (options && isNodeUnderAncestor(options, node)) {
                return true;
            }
        }

        current = parent;
    }

    return false;
}

/**
 * Returns true for `{ statusCode: ... }` objects passed to Error constructors.
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when used as Error/TreatedError constructor argument.
 */
function isErrorConstructorMetadataObject(node) {
    const parent = node.parent;

    if (parent?.type !== "NewExpression") {
        return false;
    }

    const callee = parent.callee;

    if (callee?.type !== "Identifier") {
        return false;
    }

    if (callee.name !== "TreatedError" && callee.name !== "Error") {
        return false;
    }

    return parent.arguments.includes(node);
}

/**
 * Returns true when inline-object policy should not apply to this literal.
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when the literal is exempt.
 */
function isExemptInlineObjectLiteral(node) {
    return (
        isDeclarativeConfigObjectLiteral(node) ||
        isVueComponentOptionsObjectLiteral(node) ||
        isStaticStringMapObjectLiteral(node) ||
        isOrmQueryConfigObjectLiteral(node) ||
        isErrorConstructorMetadataObject(node) ||
        isTypeBoxSchemaConfigObjectLiteral(node)
    );
}

function isVueComponentOptionsObjectLiteral(node) {
    const root = getVueComponentOptionsRoot(node);

    if (!root) {
        return false;
    }

    let current = node;

    while (current) {
        if (current === root) {
            return true;
        }

        current = current.parent;
    }

    return false;
}

/**
 * Returns true when a property value is a primitive literal (string, number, boolean, null, bigint, regex).
 *
 * Nested objects, calls, and other expressions are not literals. Each nested object is checked on its own.
 *
 * @param {import("estree").Expression | import("estree").Pattern | undefined} value Property value.
 * @returns {boolean} True when the value node is a primitive literal.
 */
function isPrimitiveLiteralExpression(value) {
    if (!value || value.type !== "Literal") {
        return false;
    }

    if (value.regex || typeof value.bigint === "string") {
        return true;
    }

    if (value.value === null) {
        return true;
    }

    const valueType = typeof value.value;

    return valueType === "string" || valueType === "number" || valueType === "boolean" || valueType === "bigint";
}

/**
 * Returns true when every property value of this object is a primitive literal.
 *
 * @param {import("estree").ObjectExpression["properties"]} properties Object members.
 * @returns {boolean} True when the object is inline data made only of literals.
 */
function isLiteralOnlyInlineObject(properties) {
    if (properties.length === 0) {
        return false;
    }

    for (const prop of properties) {
        if (prop.type !== "Property" || prop.method === true || prop.shorthand === true || prop.kind !== "init") {
            return false;
        }

        if (!isPrimitiveLiteralExpression(prop.value)) {
            return false;
        }
    }

    return true;
}

/**
 * Returns true for object literals passed to TypeBox `Type.*` builders.
 *
 * @param {import("estree").ObjectExpression} node Object literal expression.
 * @returns {boolean} True when the literal is schema definition, not a domain DTO.
 */
function isTypeBoxSchemaConfigObjectLiteral(node) {
    const parent = node.parent;

    if (parent?.type !== "CallExpression") {
        return false;
    }

    const callee = parent.callee;

    if (callee?.type !== "MemberExpression" || callee.computed) {
        return false;
    }

    if (callee.object?.type !== "Identifier" || callee.object.name !== "Type") {
        return false;
    }

    return parent.arguments.includes(node);
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
 * Only objects whose values are all primitive literals are in scope. Expressions
 * (`session.token`, `n ?? 0`) and nested objects are not. Nested objects are judged alone.
 *
 * @param properties Object members.
 * @param _maxShorthandProperties Kept for rule option compatibility. Shorthand objects are never literal-only.
 * @returns True when the object literal violates the inline policy.
 */
function isViolatingInlineObjectLiteral(properties, _maxShorthandProperties) {
    return isLiteralOnlyInlineObject(properties);
}

module.exports = {
    CLI_BUILDER_METHOD_NAMES,
    ORM_QUERY_METHOD_NAMES,
    isShorthandProperty,
    isPrimitiveLiteralExpression,
    isLiteralOnlyInlineObject,
    isViolatingInlineObjectLiteral,
    isDeclarativeConfigObjectLiteral,
    isDeclarativeConfigObjectLiteralForArgument,
    isVueComponentOptionsObjectLiteral,
    isStaticStringMapObjectLiteral,
    isOrmQueryConfigObjectLiteral,
    isErrorConstructorMetadataObject,
    isTypeBoxSchemaConfigObjectLiteral,
    isExemptInlineObjectLiteral
};
