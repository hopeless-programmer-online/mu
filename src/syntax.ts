import { join as join_path } from 'path'
import { readFile } from 'fs-extra'
import { Grammars, IToken } from 'ebnf'


export class File {
    public static readonly symbol = Symbol(`syntax.File.symbol`)

    public readonly statements : StatementUnion[] = []

    public constructor({ statements } : { statements? : StatementUnion[] } = {}) {
        if (!statements) statements = []

        this.statements = statements
    }

    public get symbol() : typeof File.symbol {
        return File.symbol
    }

    public toString() {
        return this.statements.join(`\n`) + `\n`
    }
}

export class ExpressionStatement {
    public static readonly symbol = Symbol(`syntax.ExpressionStatement.symbol`)

    public readonly expression : ExpressionUnion

    public constructor({ expression } : { expression : ExpressionUnion }) {
        this.expression = expression
    }

    public get symbol() : typeof ExpressionStatement.symbol {
        return ExpressionStatement.symbol
    }

    public toString() {
        return this.expression.toString()
    }
}

export class BlockStatement {
    public static readonly symbol = Symbol(`syntax.BlockStatement.symbol`)

    public readonly statements : StatementUnion[] = []

    public constructor({ statements } : { statements : StatementUnion[] }) {
        this.statements = statements
    }

    public get symbol() : typeof BlockStatement.symbol {
        return BlockStatement.symbol
    }

    public toString() {
        let body = this.statements.join(`\n`)

        if (body.length > 0) body = tab(body) + `\n`

        return `{\n${body}}`
    }
}

export class ReturnStatement {
    public static readonly symbol = Symbol(`syntax.ReturnStatement.symbol`)

    public readonly expression : ExpressionUnion

    public constructor({ expression } : { expression : ExpressionUnion }) {
        this.expression = expression
    }

    public get symbol() : typeof ReturnStatement.symbol {
        return ReturnStatement.symbol
    }

    public toString() {
        let result = `${this.expression}`

        if (result !== ``) result = ` ${result}`

        return `return${result}`
    }
}

export class IfStatement {
    public static readonly symbol = Symbol(`syntax.IfStatement.symbol`)

    public readonly condition : ExpressionUnion
    public readonly then      : StatementUnion

    public constructor({ condition, then } : { condition : ExpressionUnion, then : StatementUnion }) {
        this.condition = condition
        this.then      = then
    }

    public get symbol() : typeof IfStatement.symbol {
        return IfStatement.symbol
    }

    public toString() {
        return `if ${this.condition} then ${this.then}`
    }
}

export type StatementUnion = ExpressionStatement | BlockStatement | ReturnStatement | IfStatement

export class NoneExpression {
    public static readonly symbol = Symbol(`syntax.NoneExpression.symbol`)

    public get symbol() : typeof NoneExpression.symbol {
        return NoneExpression.symbol
    }

    public toString() {
        return ``
    }
}

export class LiteralExpression {
    public static readonly symbol = Symbol(`syntax.LiteralExpression.symbol`)

    public readonly literal : LiteralUnion

    public constructor({ literal } : { literal : LiteralUnion }) {
        this.literal = literal
    }

    public get symbol() : typeof LiteralExpression.symbol {
        return LiteralExpression.symbol
    }

    public toString() {
        return `${this.literal}`
    }
}

export class NameExpression {
    public static readonly symbol = Symbol(`syntax.NameExpression.symbol`)

    public readonly name : Name

    public constructor({ name } : { name : Name }) {
        this.name = name
    }

    public get symbol() : typeof NameExpression.symbol {
        return NameExpression.symbol
    }

    public toString() {
        return `${this.name}`
    }
}

export class AssignmentExpression {
    public static readonly symbol = Symbol(`syntax.AssignmentExpression.symbol`)

    public readonly output : DestructuringUnion
    public readonly input  : ExpressionUnion

    public constructor({ output, input } : { output : DestructuringUnion, input : ExpressionUnion }) {
        this.output = output
        this.input  = input
    }

    public get symbol() : typeof AssignmentExpression.symbol {
        return AssignmentExpression.symbol
    }

    public toString() {
        return `${this.output} = ${this.input}`
    }
}

export class ListExpression {
    public static readonly symbol = Symbol(`syntax.ListExpression.symbol`)

    public readonly expressions : ExpressionUnion[]

    public constructor({ expressions } : { expressions : ExpressionUnion[] }) {
        this.expressions = expressions
    }

    public get symbol() : typeof ListExpression.symbol {
        return ListExpression.symbol
    }

    public toString() {
        return this.expressions.join(`, `)
    }
}

export class ProgramExpression {
    public static readonly symbol = Symbol(`syntax.ProgramExpression.symbol`)

    public readonly program : Program

    public constructor({ program } : { program : Program }) {
        this.program = program
    }

    public get symbol() : typeof ProgramExpression.symbol {
        return ProgramExpression.symbol
    }

    public toString() {
        return `${this.program}`
    }
}

export class CallExpression {
    public static readonly symbol = Symbol(`syntax.CallExpression.symbol`)

    public readonly target : ExpressionUnion
    public readonly input  : ExpressionUnion

    public constructor({ target, input } : { target : ExpressionUnion, input : ExpressionUnion }) {
        this.target = target
        this.input  = input
    }

    public get symbol() : typeof CallExpression.symbol {
        return CallExpression.symbol
    }

    public toString() {
        return `${this.target}(${this.input})`
    }
}

export type ExpressionUnion = NoneExpression | LiteralExpression | NameExpression | AssignmentExpression | ListExpression | ProgramExpression | CallExpression

export class IntegerLiteral {
    public static readonly symbol = Symbol(`syntax.IntegerLiteral.symbol`)

    public readonly text : string

    public constructor({ text } : { text : string }) {
        this.text = text
    }

    public get symbol() : typeof IntegerLiteral.symbol {
        return IntegerLiteral.symbol
    }

    public is_equal(other : LiteralUnion) {
        return (
            other.symbol === IntegerLiteral.symbol &&
            other.text === this.text
        )
    }

    public toString() {
        return this.text
    }
}

export type LiteralUnion = IntegerLiteral

export class Name {
    public static readonly symbol = Symbol(`syntax.Name.symbol`)

    public readonly text : string

    public constructor({ text } : { text : string }) {
        this.text = text
    }

    public get symbol() : typeof Name.symbol {
        return Name.symbol
    }

    public toString() {
        return this.text
    }
}

export class EmptyDestructuring {
    public static readonly symbol = Symbol(`syntax.EmptyDestructuring.symbol`)

    public get symbol() : typeof EmptyDestructuring.symbol {
        return EmptyDestructuring.symbol
    }

    public toString() {
        return ``
    }
}

export class NameDestructuring {
    public static readonly symbol = Symbol(`syntax.NameDestructuring.symbol`)

    public readonly name : Name

    public constructor({ name } : { name : Name }) {
        this.name = name
    }

    public get symbol() : typeof NameDestructuring.symbol {
        return NameDestructuring.symbol
    }

    public toString() {
        return `${this.name}`
    }
}

export class ListDestructuring {
    public static readonly symbol = Symbol(`syntax.ListDestructuring.symbol`)

    public readonly expressions : DestructuringUnion[]

    public constructor({ expressions } : { expressions : DestructuringUnion[] }) {
        this.expressions = expressions
    }

    public get symbol() : typeof ListDestructuring.symbol {
        return ListDestructuring.symbol
    }

    public toString() {
        return this.expressions.join(`, `)
    }
}

export type DestructuringUnion = EmptyDestructuring | NameDestructuring | ListDestructuring

export class Program {
    public static readonly symbol = Symbol(`syntax.Program.symbol`)

    public readonly input : DestructuringUnion
    public readonly body  : StatementUnion

    public constructor({ input, body } : { input : DestructuringUnion, body : StatementUnion }) {
        this.input = input
        this.body  = body
    }

    public get symbol() : typeof Program.symbol {
        return Program.symbol
    }

    public toString() {
        return `program(${this.input}) ${this.body}`
    }
}

export class Analyzer {
    public static async create() {
        const grammar = await readFile(join_path(__dirname, `grammar.ebnf`), `utf8`)

        return new Analyzer({ grammar })
    }

    private parser : Grammars.W3C.Parser;

    private constructor({ grammar } : { grammar : string }) {
        this.parser = new Grammars.W3C.Parser(grammar)
    }

    private check_file(token : IToken) : File {
        if (token.type !== `file`) throw new Error
        if (token.children.length === 0) return new File
        if (token.children.length !== 1) throw new Error

        const statements = this.check_statements(token.children[0])

        return new File({ statements })
    }

    private check_statements(token : IToken) {
        if (token.type !== `statements`) throw new Error

        return token.children.map(child => this.check_statement(child))
    }

    private check_statement(token : IToken) : StatementUnion {
        if (token.type !== `statement`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]


        switch (token.type) {
            case `expression` : return new ExpressionStatement({ expression : this.check_expression(token) })
            case `return`     : return this.check_return(token)
            case `if`         : return this.check_if(token)
            case `block`      : return this.check_block(token)
        }

        throw new Error(`Unexpected token type: ${token.type}`)
    }

    private check_expression = (token : IToken) : ExpressionUnion => {
        if (token.type !== `expression`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `e_terminal` : return this.check_expression_terminal(token)
            case `call`       : return this.check_call(token)
            case `assignment` : return this.check_assignment(token)
            case `program`    : return new ProgramExpression({ program : this.check_program(token) })
            case `e_list`     : return this.check_expression_list(token)
        }

        throw new Error(`Unsupported expression type: ${token.type}`)
    }

    private check_expression_terminal(token : IToken) {
        if (token.type !== `e_terminal`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `name`    : return new NameExpression({ name : this.check_name(token) })
            case `literal` : return new LiteralExpression({ literal : this.check_literal(token) })
            case `e_group` : return this.check_expression_group(token)
        }

        throw new Error
    }

    private check_name(token : IToken) : Name {
        if (token.type !== `name`) throw new Error

        return new Name({ text : token.text })
    }

    private check_literal(token : IToken) {
        if (token.type !== `literal`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `integer` : return this.check_integer(token)
        }

        throw new Error
    }

    private check_integer(token : IToken) : IntegerLiteral {
        if (token.type !== `integer`) throw new Error

        return new IntegerLiteral({ text : token.text })
    }

    private check_expression_group(token : IToken) : ExpressionUnion {
        if (token.type !== `e_group`) throw new Error
        if (token.children.length === 0) return new NoneExpression
        if (token.children.length !== 1) throw new Error

        return this.check_expression(token.children[0])
    }

    private check_call(token : IToken) : CallExpression {
        if (token.type !== `call`) throw new Error
        if (token.children.length !== 2) throw new Error

        const target = this.check_expression_terminal(token.children[0])
        const input = this.check_expression_group(token.children[1])

        return new CallExpression({ target, input })
    }

    private check_assignment(token : IToken) : AssignmentExpression {
        if (token.type !== `assignment`) throw new Error
        if (token.children.length != 2) throw new Error

        const output = this.check_target(token.children[0])
        const input  = this.check_expression(token.children[1])

        return new AssignmentExpression({ output, input })
    }

    private check_expression_list(token : IToken) : ListExpression {
        if (token.type !== `e_list`) throw new Error
        if (token.children.length < 1) throw new Error

        const first = this.check_expression_terminal(token.children[0])
        const rest = token.children.slice(1).map(this.check_expression)

        return new ListExpression({ expressions : [ first, ...rest ] })
    }

    private check_target = (token : IToken) : DestructuringUnion => {
        if (token.type !== `target`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `t_terminal` : return this.check_target_terminal(token)
            case `t_list`     : return this.check_target_list(token)
        }

        throw new Error
    }

    private check_target_terminal(token : IToken) : DestructuringUnion {
        if (token.type !== `t_terminal`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `name`    : return new NameDestructuring({ name : this.check_name(token) })
            case `t_group` : return this.check_target_group(token)
        }

        throw new Error
    }

    private check_target_group(token : IToken) : DestructuringUnion {
        if (token.type !== `t_group`) throw new Error
        if (token.children.length === 0) return new EmptyDestructuring
        if (token.children.length !== 1) throw new Error

        return this.check_target(token.children[0])
    }

    private check_target_list(token : IToken) : ListDestructuring {
        if (token.type !== `t_list`) throw new Error
        if (token.children.length < 1) throw new Error

        const first = this.check_target_terminal(token.children[0])
        const rest = token.children.slice(1).map(this.check_target)

        return new ListDestructuring({ expressions : [ first, ...rest ] })
    }

    private check_block(token : IToken) : BlockStatement {
        if (token.type !== `block`) throw new Error

        const statements = token.children.map(child => this.check_statement(child))

        return new BlockStatement({ statements })
    }

    private check_return(token : IToken) : ReturnStatement {
        if (token.type !== `return`) throw new Error

        const expression = (
            token.children.length === 0 ? new NoneExpression :
            token.children.length === 1 ? this.check_expression(token.children[0]) :
            (() => { throw new Error })()
        )

        return new ReturnStatement({ expression })
    }

    private check_if(token : IToken) : IfStatement {
        if (token.type !== `if`) throw new Error
        if (token.children.length !== 2) throw new Error

        return new IfStatement({
            condition : this.check_expression(token.children[0]),
            then      : this.check_statement(token.children[1]),
        })
    }

    private check_program(token : IToken) : Program {
        if (token.type !== `program`) throw new Error
        if (token.children.length != 2) throw new Error

        return new Program({
            input : this.check_target_group(token.children[0]),
            body  : this.check_statement(token.children[1]),
        })
    }

    public analyze_text(text : string) {
        const root = this.parser.getAST(text)

        return this.check_file(root)
    }

    public async analyze_file(path : string) {
        const text = await readFile(path, `utf8`)

        return this.analyze_text(text)
    }
}

function tab(text : string, indent = `    `) {
    return text.replace(/^/, indent).replace(/\n/, indent)
}
