/**
 * Requires a @throws JSDoc tag on any documented function that contains a
 * direct (non-nested) `throw` statement.
 *
 * "Direct" means the throw is in the function's own body, not inside a nested
 * function expression or arrow function — those are considered separate units.
 *
 * The autofix inserts one `@throws {{@link Type}}` line per unique thrown type,
 * just before the closing `*\/` of the JSDoc comment.
 *
 * Supported throw patterns and their resolved label:
 *   throw new Foo(...)          → {@link Foo}
 *   throw new ns.Foo(...)       → {@link ns.Foo}
 *   throw Errors.bar()          → {@link Errors.bar}
 *   throw someVar               → {@link someVar}
 *   throw err / throw e         → (rethrow — skipped, no tag added)
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require @throws TSDoc tag on documented functions that contain a throw statement",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /** Returns the nearest JSDoc block comment for a function node, walking up exports/variables. */
        function getJsDocComment(node) {
            const nodesToCheck = [node];
            const parent = node.parent;

            if (parent) {
                if (
                    parent.type === "ExportNamedDeclaration" ||
                    parent.type === "ExportDefaultDeclaration" ||
                    parent.type === "MethodDefinition" ||
                    parent.type === "Property"
                ) {
                    nodesToCheck.push(parent);
                }

                if (parent.type === "VariableDeclarator" && parent.parent?.type === "VariableDeclaration") {
                    nodesToCheck.push(parent.parent);

                    if (parent.parent.parent?.type === "ExportNamedDeclaration") {
                        nodesToCheck.push(parent.parent.parent);
                    }
                }
            }

            for (const candidate of nodesToCheck) {
                const comments = sourceCode.getCommentsBefore(candidate);

                for (let i = comments.length - 1; i >= 0; i--) {
                    const comment = comments[i];

                    if (comment.type === "Block" && comment.value.startsWith("*")) {
                        return comment;
                    }
                }
            }

            return null;
        }

        /** Returns true when the JSDoc comment already contains @throws or @throw. */
        function hasThrowsTag(commentValue) {
            return /@throws?\b/.test(commentValue);
        }

        /**
         * Derives a human-readable link label from the thrown expression node.
         *
         * Returns `null` for bare re-throws (single identifiers whose name is a
         * common catch-clause variable: e, err, error, ex, cause).
         */
        function getLinkLabel(throwArgument) {
            if (!throwArgument) {
                return null;
            }

            // throw new Foo(...) or throw new a.B(...)
            if (throwArgument.type === "NewExpression") {
                return getMemberName(throwArgument.callee);
            }

            // throw Errors.bar() — static factory method call
            if (throwArgument.type === "CallExpression") {
                return getMemberName(throwArgument.callee);
            }

            // throw someIdentifier — could be a re-throw (e, err, error, ex, cause)
            if (throwArgument.type === "Identifier") {
                const RETHROW_NAMES = new Set(["e", "err", "error", "ex", "cause", "reason"]);

                if (RETHROW_NAMES.has(throwArgument.name)) {
                    return null;
                }

                return throwArgument.name;
            }

            return null;
        }

        /** Recursively builds a dotted name string from MemberExpression / Identifier. */
        function getMemberName(node) {
            if (!node) {
                return null;
            }

            if (node.type === "Identifier") {
                return node.name;
            }

            if (node.type === "MemberExpression" && !node.computed) {
                const obj = getMemberName(node.object);
                const prop = node.property.type === "Identifier" ? node.property.name : null;

                if (obj && prop) {
                    return `${obj}.${prop}`;
                }
            }

            return null;
        }

        /**
         * Collects all direct ThrowStatement nodes from a function body, stopping
         * at nested function scopes.
         */
        function collectDirectThrows(functionNode) {
            const throws = [];
            const body = functionNode.body;

            if (!body) {
                return throws;
            }

            function walk(node) {
                if (!node || typeof node !== "object") {
                    return;
                }

                if (node.type === "ThrowStatement") {
                    throws.push(node);
                    return;
                }

                if (
                    node !== functionNode &&
                    (
                        node.type === "FunctionDeclaration" ||
                        node.type === "FunctionExpression" ||
                        node.type === "ArrowFunctionExpression"
                    )
                ) {
                    return;
                }

                for (const key of Object.keys(node)) {
                    if (key === "parent") {
                        continue;
                    }

                    const child = node[key];

                    if (Array.isArray(child)) {
                        for (const item of child) {
                            if (item && typeof item.type === "string") {
                                walk(item);
                            }
                        }
                    } else if (child && typeof child.type === "string") {
                        walk(child);
                    }
                }
            }

            walk(body);

            return throws;
        }

        function handleFunction(node) {
            const comment = getJsDocComment(node);

            if (!comment) {
                return;
            }

            if (hasThrowsTag(comment.value)) {
                return;
            }

            const throwNodes = collectDirectThrows(node);

            if (throwNodes.length === 0) {
                return;
            }

            // Collect unique, non-null labels preserving first-seen order.
            const seen = new Set();
            const labels = [];

            for (const throwNode of throwNodes) {
                const label = getLinkLabel(throwNode.argument);

                if (label && !seen.has(label)) {
                    seen.add(label);
                    labels.push(label);
                }
            }

            // If every throw is a bare re-throw (e/err/error) we still flag but
            // insert a generic placeholder so the developer fills it in.
            const tagsToInsert = labels.length > 0
                ? labels.map((l) => `@throws {${l}} {@link ${l}}`)
                : ["@throws {unknown}"];

            context.report({
                node: comment,
                message: "Function throws but is missing a @throws JSDoc tag.",
                fix(fixer) {
                    // comment.value is the raw text between "/*" and "*/" (delimiters excluded).
                    // For "/**\n * foo\n */" the value is "*\n * foo\n ".
                    const raw = comment.value;

                    // The closing line of a JSDoc comment is "\n<indent>*/".
                    // We find the last "\n" in comment.value to determine the indent.
                    const lastNewlineIdx = raw.lastIndexOf("\n");
                    const closingIndent = lastNewlineIdx >= 0 ? raw.slice(lastNewlineIdx + 1) : "";

                    // The line prefix for tag lines (e.g. " * " for standard JSDoc).
                    const linePrefix = `${closingIndent}* `;

                    // Build new tag lines — each on its own line, ending with a newline
                    // so the closing "*/" stays on its own line.
                    const tagLines = tagsToInsert
                        .map((tag) => `${linePrefix}${tag}`)
                        .join("\n");

                    // We replace the "\n<closingIndent>" that precedes the "*/" with
                    // "\n<tags>\n<closingIndent>", preserving the closing line intact.
                    // range[1] points past "*/"; the "*/" is 2 chars; before it sits "\n<closingIndent>".
                    const closingLineLen = 1 + closingIndent.length; // "\n" + indent
                    const replaceStart = comment.range[1] - 2 - closingLineLen;
                    const replaceEnd = comment.range[1] - 2;

                    return fixer.replaceTextRange(
                        [replaceStart, replaceEnd],
                        `\n${tagLines}\n${closingIndent}`
                    );
                }
            });
        }

        return {
            FunctionDeclaration: handleFunction,
            FunctionExpression: handleFunction,
            ArrowFunctionExpression: handleFunction
        };
    }
};
