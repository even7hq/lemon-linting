/**
 * Shared JSDoc tag normalization for TypeScript.
 *
 * Correct:   @param req The request
 * Incorrect: @param req - The request
 * Incorrect: @param req {String} The request
 * Allowed:  @param params {@link Foo} Description
 */

/**
 * Regular expression to match raw parameter type declarations.
 */
const RAW_PARAM_TYPE_RE = /(@param\s+\S+)\s+\{(?!@)[^}]+\}\s*/g;

/**
 * Regular expression to match parameter type declarations with a dash separator.
 */
const PARAM_DASH_RE = /(@param\s+\S+(?:\s+\{@[^}]+\})*)\s+[-–—]\s+/;

/**
 * Regular expression to match return type declarations with a dash separator.
 */
const RETURNS_DASH_RE = /(@returns?)\s+[-–—]\s+(?=[A-Za-z`"'/{])/;

/**
 * Normalizes a single JSDoc comment line containing @param or @returns tags.
 *
 * @param line A line from inside a block comment (may include leading ` * `).
 * @returns The normalized line, unchanged when no tag rules apply.
 */
function normalizeJsdocLine(line) {
    if (!/@param\b|@returns?\b/.test(line)) {
        return line;
    }

    let result = line;

    if (/@param\b/.test(result)) {
        result = result.replace(RAW_PARAM_TYPE_RE, "$1 ");
        result = result.replace(PARAM_DASH_RE, "$1 ");
    }

    if (/@returns?\b/.test(result)) {
        result = result.replace(RETURNS_DASH_RE, "$1 ");
    }

    return result;
}

/**
 * Normalizes all JSDoc lines inside a block comment inner value.
 *
 * @param commentValue The inner text of a block comment (without surrounding delimiters).
 * @returns Normalized inner text.
 */
function normalizeJsdocCommentValue(commentValue) {
    return commentValue
        .split("\n")
        .map((line) => normalizeJsdocLine(line))
        .join("\n");
}

/**
 * Normalizes JSDoc block comments in a full source file.
 *
 * @param text Full file contents.
 * @returns Updated file contents.
 */
function normalizeFileContent(text) {
    return text.replace(/\/\*\*[\s\S]*?\*\//g, (comment) => {
        const inner = comment.slice(3, -2);
        const normalized = normalizeJsdocCommentValue(inner);

        if (normalized === inner) {
            return comment;
        }

        return `/**${normalized}*/`;
    });
}

/**
 * Returns true when the line still violates JSDoc tag formatting rules.
 *
 * @param line A line from inside a block comment.
 * @returns True when the line should be normalized.
 */
function hasJsdocTagFormatViolation(line) {
    return normalizeJsdocLine(line) !== line;
}

module.exports = {
    normalizeJsdocLine,
    normalizeJsdocCommentValue,
    normalizeFileContent,
    hasJsdocTagFormatViolation
};
