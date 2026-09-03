/**
 * Matches a closing multiline return/object type brace immediately followed by the
 * method body opener on the same line: `} {`.
 */
const RETURN_TYPE_CLOSE_THEN_BODY = /^\s+\} \{\s*$/;

/**
 * @param {import("eslint").Linter.LintMessage} message
 * @param {string | undefined} sourceLine
 * @returns {boolean}
 */
function shouldSuppressIndentReturnTypeClose(message, sourceLine) {
    if (message.ruleId !== "indent" || message.messageId !== "wrongIndentation") {
        return false;
    }

    if (!sourceLine || !RETURN_TYPE_CLOSE_THEN_BODY.test(sourceLine)) {
        return false;
    }

    const match = message.message.match(/Expected indentation of (\d+) spaces but found (\d+)/);

    if (!match) {
        return false;
    }

    const expected = Number(match[1]);
    const found = Number(match[2]);

    // The false positive always pushes the close brace to the inner property indent.
    return expected > found;
}

/**
 * @type {Map<string, string[]>}
 */
const sourceLinesByFilename = new Map();

/**
 * @type {import("eslint").Linter.Processor}
 */
const processor = {
    meta: {
        name: "filter-indent-return-type-close",
        version: "1.0.0"
    },

    preprocess(text, filename) {
        sourceLinesByFilename.set(filename, text.split(/\r?\n/));
        // Return plain strings so ESLint does not synthesize virtual filenames that
        // break @typescript-eslint/parser project resolution on CLI file arguments.
        return [text];
    },

    postprocess(messages, filename) {
        const lines = sourceLinesByFilename.get(filename) ?? [];
        sourceLinesByFilename.delete(filename);

        return messages.flat().filter((message) => {
            const sourceLine = lines[message.line - 1];
            return !shouldSuppressIndentReturnTypeClose(message, sourceLine);
        });
    },

    supportsAutofix: true
};

module.exports = {
    processor,
    shouldSuppressIndentReturnTypeClose
};
