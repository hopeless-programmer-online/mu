import * as syntax from './syntax'

export type StatementUnion = BlockStatement | ReturnStatement | IfStatement | CallStatement | AssignmentStatement
export type ScopeUnion = File | Program
export type VariableUnion = NamedVariable | LiteralVariable | ClosureVariable | UnnamedVariable | UndeclaredVariable | ExternalVariable

export class File {
    public static readonly symbol = Symbol(`syntax.File.symbol`)

    public readonly statements : StatementUnion[] = []
    public readonly variables  : VariableUnion[] = []

    public get symbol() : typeof File.symbol {
        return File.symbol
    }
}

export class Program {
    public static readonly symbol = Symbol(`syntax.Program.symbol`)

    public readonly parent     : ScopeUnion
    public readonly statements : StatementUnion[] = []
    public readonly variables  : VariableUnion[] = []

    public constructor({ parent } : { parent : ScopeUnion }) {
        this.parent = parent
    }

    public get symbol() : typeof Program.symbol {
        return Program.symbol
    }
}

export class BlockStatement {
    public static readonly symbol = Symbol(`syntax.BlockStatement.symbol`)

    public readonly statements : StatementUnion[] = []

    public get symbol() : typeof BlockStatement.symbol {
        return BlockStatement.symbol
    }
}

export class ReturnStatement {
    public static readonly symbol = Symbol(`syntax.ReturnStatement.symbol`)

    public readonly variable = null

    public get symbol() : typeof ReturnStatement.symbol {
        return ReturnStatement.symbol
    }
}

export class IfStatement {
    public static readonly symbol = Symbol(`syntax.IfStatement.symbol`)

    public readonly condition = null
    // public readonly then      : StatementUnion = null

    public get symbol() : typeof IfStatement.symbol {
        return IfStatement.symbol
    }
}

export class CallStatement {
    public static readonly symbol = Symbol(`syntax.CallStatement.symbol`)

    public readonly target : VariableUnion
    public readonly input  : VariableUnion
    public readonly output : VariableUnion

    public constructor({
        target,
        input,
        output,
    } : {
        target : VariableUnion
        input  : VariableUnion
        output : VariableUnion
    }) {
        this.target = target
        this.input  = input
        this.output = output
    }

    public get symbol() : typeof CallStatement.symbol {
        return CallStatement.symbol
    }
}

export class AssignmentStatement {
    public static readonly symbol = Symbol(`syntax.AssignmentStatement.symbol`)

    public readonly input  : VariableUnion
    public readonly output : VariableUnion

    public constructor({ input, output } : { input : VariableUnion, output : VariableUnion }) {
        this.input  = input
        this.output = output
    }

    public get symbol() : typeof AssignmentStatement.symbol {
        return AssignmentStatement.symbol
    }
}

export class NamedVariable {
    public static readonly symbol = Symbol(`syntax.NamedVariable.symbol`)

    public readonly name : syntax.Name

    public constructor({ name } : { name : syntax.Name }) {
        this.name = name
    }

    public get symbol() : typeof NamedVariable.symbol {
        return NamedVariable.symbol
    }
}

export class LiteralVariable {
    public static readonly symbol = Symbol(`syntax.LiteralVariable.symbol`)

    public readonly literal : syntax.LiteralUnion

    public constructor({ literal } : { literal : syntax.LiteralUnion }) {
        this.literal = literal
    }

    public get symbol() : typeof LiteralVariable.symbol {
        return LiteralVariable.symbol
    }
}

export class ClosureVariable {
    public static readonly symbol = Symbol(`syntax.ClosureVariable.symbol`)

    public readonly source : VariableUnion

    public constructor({ source } : { source : VariableUnion }) {
        this.source = source
    }

    public get symbol() : typeof ClosureVariable.symbol {
        return ClosureVariable.symbol
    }
}

export class UnnamedVariable {
    public static readonly symbol = Symbol(`syntax.UnnamedVariable.symbol`)

    public readonly expression : syntax.ExpressionUnion

    public constructor({ expression } : { expression : syntax.ExpressionUnion }) {
        this.expression = expression
    }

    public get symbol() : typeof UnnamedVariable.symbol {
        return UnnamedVariable.symbol
    }
}

export class UndeclaredVariable {
    public static readonly symbol = Symbol(`syntax.UndeclaredVariable.symbol`)

    private _value : VariableUnion | null = null

    public readonly name : syntax.Name

    public constructor({ name } : { name : syntax.Name }) {
        this.name = name
    }

    public get symbol() : typeof UndeclaredVariable.symbol {
        return UndeclaredVariable.symbol
    }

    public get value() {
        if (!this._value) throw new Error

        return this._value
    }
    public set value(value : VariableUnion) {
        if (this._value) throw new Error

        this._value = value
    }

    public get is_declared() {
        return this._value !== null
    }
}

export class ExternalVariable {
    public static readonly symbol = Symbol(`syntax.ExternalVariable.symbol`)

    public readonly name : syntax.Name

    public constructor({ name } : { name : syntax.Name }) {
        this.name = name
    }

    public get symbol() : typeof ExternalVariable.symbol {
        return ExternalVariable.symbol
    }
}

export class Analyzer {
    public analyze(root : syntax.File) {
        const file = new File

        process_statements(root.statements, file)

        return file
    }
}

function assert_never(never : never, error : Error) : never {
    throw error
}

function process_statements(statements : syntax.StatementUnion[], scope : ScopeUnion) {
    for (const statement of statements) process_statement(statement, scope)

        for (const x of scope.variables) {
            if (x.symbol !== UndeclaredVariable.symbol || x.is_declared) continue
            if (scope.symbol === Program.symbol) {
                const undeclared = new UndeclaredVariable({ name : x.name })

                scope.parent.variables.push(undeclared)

                const closure = new ClosureVariable({ source : undeclared })

                x.value = closure
            }
            else {
                const external = new ExternalVariable({ name : x.name })

                x.value = external
            }
        }
}

function process_statement(statement : syntax.StatementUnion, scope : ScopeUnion) {
    if (statement.symbol === syntax.ExpressionStatement.symbol) {
        process_expression(statement.expression, scope)
    }
    else if (statement.symbol === syntax.BlockStatement.symbol) {
        throw new Error // @todo
    }
    else if (statement.symbol === syntax.IfStatement.symbol) {
        throw new Error // @todo
    }
    else if (statement.symbol === syntax.ReturnStatement.symbol) {
        throw new Error // @todo
    }
    else assert_never(statement, new Error) // @todo
}

function process_expression(expression : syntax.ExpressionUnion, scope : ScopeUnion) : VariableUnion {
    if (expression.symbol === syntax.NoneExpression.symbol) {
        return find_named(new syntax.Name({ text : `none` }), scope)
    }
    else if (expression.symbol === syntax.NameExpression.symbol) {
        return find_named(expression.name, scope)
    }
    else if (expression.symbol === syntax.LiteralExpression.symbol) {
        const variable = find_literal(expression.literal, scope)

        return variable
    }
    else if (expression.symbol === syntax.AssignmentExpression.symbol) {
        const variable = process_expression(expression.input, scope)

        process_destructuring(expression.output, variable, scope)

        return variable
    }
    else if (expression.symbol === syntax.ListExpression.symbol) {
        throw new Error // @todo
    }
    else if (expression.symbol === syntax.CallExpression.symbol) {
        const target = process_expression(expression.target, scope)
        const input = process_expression(expression.input, scope)
        const output = new UnnamedVariable({ expression })

        scope.variables.push(output)
        scope.statements.push(new CallStatement({ input, target, output }))

        return output
    }
    else if (expression.symbol === syntax.ProgramExpression.symbol) {
        throw new Error // @todo
    }
    else assert_never(expression, new Error) // @todo
}

function find_literal(literal : syntax.LiteralUnion, scope : ScopeUnion) : VariableUnion {
    function match_literal(other : VariableUnion) : boolean {
        if (other.symbol === LiteralVariable.symbol) return other.literal.is_equal(literal)
        if (other.symbol === ClosureVariable.symbol) return match_literal(other.source)

        return false
    }

    const existed = scope.variables.find(match_literal)

    if (existed) return existed
    if (scope.symbol === Program.symbol) {
        const source = find_literal(literal, scope.parent)
        const variable = new ClosureVariable({ source })

        scope.variables.push(variable)

        return variable
    }

    const variable = new LiteralVariable({ literal })

    scope.variables.push(variable)

    return variable
}

function find_named(name : syntax.Name, scope : ScopeUnion) : VariableUnion {
    function find_in_scope(scope : ScopeUnion) : VariableUnion | null {
        function match_named(other : VariableUnion) : boolean {
            if (other.symbol === NamedVariable.symbol) return other.name.text === name.text
            if (other.symbol === UndeclaredVariable.symbol) return other.name.text === name.text
            if (other.symbol === ClosureVariable.symbol) return match_named(other.source)

            return false
        }

        const existed = scope.variables.find(match_named)

        if (existed) return existed
        if (scope.symbol === Program.symbol && scope.parent) return find_in_scope(scope.parent)

        return null
    }

    const existed = find_in_scope(scope)

    if (existed) return existed

    const undeclared = new UndeclaredVariable({ name })

    scope.variables.push(undeclared)

    return undeclared
}

function process_destructuring(destructuring : syntax.DestructuringUnion, variable : VariableUnion, scope : ScopeUnion) {
    if (destructuring.symbol === syntax.EmptyDestructuring.symbol) {
        // do nothing
    }
    else if (destructuring.symbol === syntax.NameDestructuring.symbol) {
        const { name } = destructuring

        function match_named(other : VariableUnion) : boolean {
            if (other.symbol === NamedVariable.symbol) return other.name.text === name.text
            if (other.symbol === UndeclaredVariable.symbol) return other.name.text === name.text
            if (other.symbol === ClosureVariable.symbol) return match_named(other.source)

            return false
        }

        let output = scope.variables.find(match_named)

        if (!output || output.symbol === UndeclaredVariable.symbol) {
            const named = new NamedVariable({ name : destructuring.name })

            if (output?.symbol === UndeclaredVariable.symbol) output.value = named

            output = named

            scope.variables.push(output)

            // @todo: update undeclared
        }

        scope.statements.push(new AssignmentStatement({ input : variable, output }))
    }
    else if (destructuring.symbol === syntax.ListDestructuring.symbol) {
        throw new Error // @todo
    }
    else assert_never(destructuring, new Error) // @todo
}
