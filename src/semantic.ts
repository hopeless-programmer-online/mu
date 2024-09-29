import * as syntax from './syntax'

// export type File = {
//     programs   : Program[]
//     variables  : number
//     statements : Statement[]
// }
//
// export type Program = {
//     closure    : number[]
//     inputs     : number
//     variables  : number
//     statements : Statement[]
// }
//
// export type Declaration = {
//     type     : `declaration`
//     variable : number
//     program  : number
// }
//
// export type Call = {
//     type    : `call`
//     target  : number
//     inputs  : number[]
//     outputs : number[]
// }
//
// export type Return = {
//     type   : `return`
//     inputs : number[]
// }
//
// export type If = {
//     type       : `if`
//     condition  : number
//     statements : Statement[]
// }
//
// export type Statement = Declaration | Call | Return | If

export class File {
    public readonly frame : Frame

    public constructor({
        frame,
    } : {
        frame : Frame
    }) {
        this.frame = frame
    }
}

export class Analyzer {
    public analyze_file(root : syntax.File) {
        const frame = new Frame

        frame.scan_root(root)

        return new File({ frame: frame })
    }
}

class NamedVariable {
    public static readonly symbol = Symbol(`semantic.NamedVariable.symbol`)

    public readonly target : syntax.NameDestructuring

    public constructor({ target } : { target : syntax.NameDestructuring }) {
        this.target = target
    }

    public get symbol() : typeof NamedVariable.symbol {
        return NamedVariable.symbol
    }
}

class LiteralVariable {
    public static readonly symbol = Symbol(`semantic.LiteralVariable.symbol`)

    public readonly target : syntax.LiteralExpression

    public constructor({ target } : { target : syntax.LiteralExpression }) {
        this.target = target
    }

    public get symbol() : typeof LiteralVariable.symbol {
        return LiteralVariable.symbol
    }
}

class ExternalVariable {
    public static readonly symbol = Symbol(`semantic.ExternalVariable.symbol`)

    public readonly name : syntax.Name

    public constructor({ name } : { name : syntax.Name }) {
        this.name = name
    }

    public get symbol() : typeof ExternalVariable.symbol {
        return ExternalVariable.symbol
    }
}

class UnnamedVariable {
    public static readonly symbol = Symbol(`semantic.UnnamedVariable.symbol`)

    public readonly expression : syntax.ExpressionUnion

    public constructor({ expression } : { expression : syntax.ExpressionUnion }) {
        this.expression = expression
    }

    public get symbol() : typeof UnnamedVariable.symbol {
        return UnnamedVariable.symbol
    }
}

type VariableUnion = NamedVariable | LiteralVariable | ExternalVariable | UnnamedVariable

class Frame {
    private _parent    : Frame | null
    private _variables : VariableUnion[] = []

    public constructor({
        parent = null,
    } : {
        parent? : Frame | null
    } = {}) {
        this._parent = parent
    }

    public get root() : Frame {
        return !this._parent ? this : this._parent.root
    }

    public get variables() : ReadonlyArray<VariableUnion> {
        return this._variables
    }

    public scan_root(root : syntax.File | syntax.BlockStatement) {
        this.scan_statements(root.statements)
    }

    private scan_statements(statements : syntax.StatementUnion[]) {
        statements.forEach(this.scan_statement)
    }

    private scan_statement = (statement : syntax.StatementUnion) => {
        switch (statement.symbol) {
            case syntax.ExpressionStatement.symbol: return this.scan_expression_statement(statement)
            case syntax.ReturnStatement.symbol: return this.scan_return_statement(statement)
            case syntax.IfStatement.symbol: return this.scan_if_statement(statement)
            // case syntax.BlockStatement.symbol: return this.scan_block_statement(statement)
            default: throw new Error(`Unexpected statement: ${statement}`)
        }
    }

    private scan_expression_statement(statement : syntax.ExpressionStatement) {
        this.scan_expression(statement.expression)
    }

    private scan_return_statement(statement : syntax.ReturnStatement) {
        this.scan_expression(statement.expression)
    }

    private scan_if_statement(statement : syntax.IfStatement) {
        this.scan_expression(statement.condition)
        this.scan_statement(statement.then)
    }

    // private scan_block_statement(statement : syntax.BlockStatement) {
    //     //
    // }

    private scan_expression(expression : syntax.ExpressionUnion) {
        switch (expression.symbol) {
            case syntax.AssignmentExpression.symbol: return this.scan_assignment_expression(expression)
            case syntax.NameExpression.symbol: return this.scam_name_expression(expression)
            // case syntax.CallExpression.symbol:
            // case syntax.ListExpression.symbol:
            case syntax.LiteralExpression.symbol: return this.scan_literal_expression(expression)
            // case syntax.ProgramExpression.symbol:
            default: throw new Error(`Unexpected expression: ${expression}`)
        }
    }

    private scan_assignment_expression(expression : syntax.AssignmentExpression) : void {
        this.collect_destructuring(expression.output)
        this.scan_expression(expression.input)
    }

    private scam_name_expression(expression : syntax.NameExpression) {
        if (this.find_name(expression.name)) return

        this.root._variables.push(new ExternalVariable({ name : expression.name }))
    }

    private scan_literal_expression(expression : syntax.LiteralExpression) {
        this.root._variables.push(new LiteralVariable({ target : expression }))
    }

    private collect_destructuring = (destructuring : syntax.DestructuringUnion) => {
        switch (destructuring.symbol) {
            case syntax.EmptyDestructuring.symbol: return
            case syntax.NameDestructuring.symbol: return this.collect_name_destructuring(destructuring)
            case syntax.ListDestructuring.symbol: return this.collect_list_destructuring(destructuring)
            default: throw new Error(`Unexpected destructuring: ${destructuring}`)
        }
    }

    private collect_name_destructuring(destructuring : syntax.NameDestructuring) {
        const existed = this._variables.find(x => x.symbol === NamedVariable.symbol && x.target === destructuring)

        if (existed) return

        this._variables.push(new NamedVariable({ target : destructuring }))
    }

    private collect_list_destructuring(destructuring : syntax.ListDestructuring) {
        destructuring.expressions.forEach(this.collect_destructuring)
    }

    private find_name(name : syntax.Name) : NamedVariable | null {
        for (const variable of this._variables) {
            if (variable.symbol !== NamedVariable.symbol) continue
            if (variable.target.name.text === name.text) return variable
        }
        if (this._parent) return this._parent.find_name(name)

        return null
    }
}
