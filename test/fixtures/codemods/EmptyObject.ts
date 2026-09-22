/**
 * Test helper for InlineObjectLiteralFix codemod.
 *
 * @returns Empty object typed as T
 */
export function emptyObject<T extends object>(): T {
    return {} as T;
}
