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
    public readonly variables : VariablesContext

    public constructor({
        variables,
    } : {
        variables : VariablesContext
    }) {
        this.variables = variables
    }
}

export class Analyzer {
    public analyze_file(root : syntax.File) {
        const variables = new VariablesContext({ target : root })

        return new File({ variables })
    }
}

class VariablesContext {
    private _names : syntax.Name[] = []

    public constructor({ target } : { target : syntax.File | syntax.BlockStatement }) {
        this.scan_statements(target.statements)
    }

    public get names() : ReadonlyArray<syntax.Name> {
        return this._names
    }

    private scan_statements(statements : syntax.StatementUnion[]) {
        statements.forEach(this.scan_statement)
    }

    private scan_statement = (statement : syntax.StatementUnion) => {
        switch (statement.symbol) {
            case syntax.ExpressionStatement.symbol: return this.scan_expression_statement(statement)
            default: throw new Error(`Unexpected statement: ${statement}`)
        }
    }

    private scan_expression_statement(statement : syntax.ExpressionStatement) {
        this.scan_expression(statement.expression)
    }

    private scan_expression(expression : syntax.ExpressionUnion) {
        switch (expression.symbol) {
            case syntax.AssignmentExpression.symbol: return this.scan_assignment(expression)
            default: throw new Error(`Unexpected expression: ${expression}`)
        }
    }

    private scan_assignment(expression : syntax.AssignmentExpression) {
        this.collect_destructuring(expression.output)
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
        this.add_name(destructuring.name)
    }

    private collect_list_destructuring(destructuring : syntax.ListDestructuring) {
        destructuring.expressions.forEach(this.collect_destructuring)
    }

    private add_name(name : syntax.Name) {
        if (!this._names.includes(name)) this._names.push(name)
    }
}
