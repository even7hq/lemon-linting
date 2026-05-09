const luaparse = require("luaparse");

module.exports = {
    parseForESLint(code, options) {
        try {
            const ast = luaparse.parse(code, {
                locations: true,
                ranges: true,
                comments: true,
                luaVersion: "5.1"
            });

            // Map Chunk to Program for ESLint compatibility
            ast.type = "Program";
            ast.tokens = [];

            // Helper to traverse and map
            function traverse(node) {
                if (!node || typeof node !== "object") return;

                if (node.type === "FunctionDeclaration") {
                    node.type = "LuaFunctionDeclaration";
                    node.params = node.parameters;
                }

                if (node.type === "IfStatement") {
                    node.type = "LuaIfStatement";
                }

                if (node.type === "ForNumericStatement") {
                    node.type = "LuaForNumericStatement";
                }

                if (node.type === "ForGenericStatement") {
                    node.type = "LuaForGenericStatement";
                }

                if (node.type === "WhileStatement") {
                    node.type = "LuaWhileStatement";
                }

                if (node.type === "DoStatement") {
                    node.type = "LuaDoStatement";
                }

                if (node.type === "ReturnStatement") {
                    node.type = "LuaReturnStatement";
                }

                if (node.type === "BreakStatement") {
                    node.type = "LuaBreakStatement";
                }

                if (node.type === "Comment") {
                    node.type = node.raw.startsWith("--[[") ? "Block" : "Line";
                }
                for (const key in node) {
                    if (key === "parent") continue;
                    if (Array.isArray(node[key])) {
                        node[key].forEach(traverse);
                    } else if (node[key] && typeof node[key] === "object") {
                        traverse(node[key]);
                    }
                }
            }

            traverse(ast);

            return {
                ast,
                services: {},
                scopeManager: {
                    scopes: [{
                        type: "global",
                        block: ast,
                        variables: [],
                        references: [],
                        set: new Map(),
                        through: [],
                        variableScope: null,
                        upper: null
                    }],
                    globalScope: null,
                    getDeclaredVariables: () => []
                },

                visitorKeys: {
                    Program: ["body"],
                    LuaIfStatement: ["clauses"],
                    IfClause: ["condition", "body"],
                    ElseifClause: ["condition", "body"],
                    ElseClause: ["body"],
                    LuaWhileStatement: ["condition", "body"],
                    LuaDoStatement: ["body"],
                    RepeatStatement: ["condition", "body"],
                    LocalStatement: ["variables", "init"],
                    AssignmentStatement: ["variables", "init"],
                    CallStatement: ["expression"],
                    LuaFunctionDeclaration: ["identifier", "params", "body"],
                    LuaForNumericStatement: ["variable", "start", "end", "step", "body"],
                    LuaForGenericStatement: ["variables", "iterators", "body"],
                    LuaReturnStatement: ["arguments"],
                    LuaBreakStatement: [],

                    Identifier: [],
                    StringLiteral: [],
                    NumericLiteral: [],
                    BooleanLiteral: [],
                    NilLiteral: [],
                    VarargLiteral: [],

                    TableConstructorExpression: ["fields"],
                    TableKey: ["key", "value"],
                    TableKeyString: ["key", "value"],
                    TableValue: ["value"],

                    BinaryExpression: ["left", "right"],
                    UnaryExpression: ["argument"],
                    MemberExpression: ["base", "identifier"],
                    IndexExpression: ["base", "index"],
                    CallExpression: ["base", "arguments"],
                    TableCallExpression: ["base", "arguments"],
                    StringCallExpression: ["base", "argument"],

                    LogicalExpression: ["left", "right"],
                    Block: [],
                    Line: []
                }
            };
        } catch (err) {
            throw err;
        }
    }
};
