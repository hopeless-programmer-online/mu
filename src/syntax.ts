import { join as join_path } from 'path'
import { readFile } from 'fs-extra'
import { Grammars, IToken } from 'ebnf'

export type File = {
    type       : `file`
    statements : Statement[]
}

export type Statement = ExpressionStatement | Block | Return | If

export type ExpressionStatement = {
    type       : `expression_statement`
    expression : Expression
}

export type Block = {
    type       : `block`
    statements : Statement[]
}

export type Return = {
    type       : `return`
    expression : Expression
}

export type If = {
    type      : `if`
    condition : Expression
    then      : Statement
}

export type Expression = Name | Integer | Call | Empty | Assignment | ExpressionList | Program

export type Name = {
    type : `name`
    text : string
}

export type Integer = {
    type : `integer`
    text : string
}

export type Call = {
    type   : `call`
    target : Expression
    input  : Expression
}

export type Empty = {
    type : `empty`
}

export type Assignment = {
    type   : `assignment`
    output : Target
    input  : Expression
}

export type ExpressionList = {
    type        : `expression_list`
    expressions : Expression[]
}

export type Target = Name | TargetList | Empty

export type TargetList = {
    type    : `target_list`
    targets : Target[]
}

export type Program = {
    type     : `program`
    argument : Target
    body     : Statement
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
        if (token.children.length !== 1) throw new Error

        const statements = this.check_statements(token.children[0])

        return { type : `file`, statements }
    }

    private check_statements(token : IToken) {
        if (token.type !== `statements`) throw new Error

        return token.children.map(child => this.check_statement(child))
    }

    private check_statement(token : IToken) : Statement {
        if (token.type !== `statement`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]


        switch (token.type) {
            case `expression` : return this.check_expression_statement(token)
            case `return`     : return this.check_return(token)
            case `if`         : return this.check_if(token)
            case `block`      : return this.check_block(token)
        }

        throw new Error(`Unexpected token type: ${token.type}`)
    }

    private check_expression_statement = (token : IToken) : ExpressionStatement => {
        return {
            type       : `expression_statement`,
            expression : this.check_expression(token),
        }
    }

    private check_expression = (token : IToken) => {
        if (token.type !== `expression`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `e_terminal` : return this.check_expression_terminal(token)
            case `call`       : return this.check_call(token)
            case `assignment` : return this.check_assignment(token)
            case `program`    : return this.check_program(token)
            case `e_list`     : return this.check_expression_list(token)
        }

        throw new Error(`Unsupported expression type: ${token.type}`)
    }

    private check_expression_terminal(token : IToken) {
        if (token.type !== `e_terminal`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `name`    : return this.check_name(token)
            case `literal` : return this.check_literal(token)
            case `e_group` : return this.check_expression_group(token)
        }

        throw new Error
    }

    private check_name(token : IToken) : Name {
        if (token.type !== `name`) throw new Error

        return { type : `name`, text : token.text }
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

    private check_integer(token : IToken) : Integer {
        if (token.type !== `integer`) throw new Error

        return { type : `integer`, text : token.text }
    }

    private check_expression_group(token : IToken) : Expression {
        if (token.type !== `e_group`) throw new Error
        if (token.children.length === 0) return { type : `empty` }
        if (token.children.length !== 1) throw new Error

        return this.check_expression(token.children[0])
    }

    private check_call(token : IToken) : Call {
        if (token.type !== `call`) throw new Error
        if (token.children.length !== 2) throw new Error

        const target = this.check_expression_terminal(token.children[0])
        const input = this.check_expression_group(token.children[1])

        return { type : `call`, target, input }
    }

    private check_assignment(token : IToken) : Assignment {
        if (token.type !== `assignment`) throw new Error
        if (token.children.length != 2) throw new Error

        const output = this.check_target(token.children[0])
        const input  = this.check_expression(token.children[1])

        return { type : `assignment`, output, input }
    }

    private check_expression_list(token : IToken) : ExpressionList {
        if (token.type !== `e_list`) throw new Error
        if (token.children.length < 1) throw new Error

        const first = this.check_expression_terminal(token.children[0])
        const rest = token.children.slice(1).map(this.check_expression)

        return { type : `expression_list`, expressions : [ first, ...rest ] }
    }

    private check_target = (token : IToken) : Target => {
        if (token.type !== `target`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `t_terminal` : return this.check_target_terminal(token)
            case `t_list`     : return this.check_target_list(token)
        }

        throw new Error
    }

    private check_target_terminal(token : IToken) : Target {
        if (token.type !== `t_terminal`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `name`    : return this.check_name(token)
            case `t_group` : return this.check_target_group(token)
        }

        throw new Error
    }

    private check_target_group(token : IToken) : Target {
        if (token.type !== `t_group`) throw new Error
        if (token.children.length === 0) return { type : `empty` }
        if (token.children.length !== 1) throw new Error

        return this.check_target(token.children[0])
    }

    private check_target_list(token : IToken) : TargetList {
        if (token.type !== `t_list`) throw new Error
        if (token.children.length < 1) throw new Error

        const first = this.check_target_terminal(token.children[0])
        const rest = token.children.slice(1).map(this.check_target)

        return { type : `target_list`, targets : [ first, ...rest ] }
    }

    private check_block(token : IToken) : Block {
        if (token.type !== `block`) throw new Error

        return {
            type       : `block`,
            statements : token.children.map(child => this.check_statement(child)),
        }
    }

    private check_return(token : IToken) : Return {
        if (token.type !== `return`) throw new Error

        return {
            type       : `return`,
            expression : (
                token.children.length === 0 ? { type : `empty` } :
                token.children.length === 1 ? this.check_expression(token.children[0]) :
                (() => { throw new Error })()
            ),
        }
    }

    private check_if(token : IToken) : If {
        if (token.type !== `if`) throw new Error
        if (token.children.length !== 2) throw new Error

        return {
            type      : `if`,
            condition : this.check_expression(token.children[0]),
            then      : this.check_statement(token.children[1]),
        }
    }

    private check_program(token : IToken) : Program {
        if (token.type !== `program`) throw new Error
        if (token.children.length != 2) throw new Error

        return {
            type     : `program`,
            argument : this.check_target_group(token.children[0]),
            body     : this.check_statement(token.children[1]),
        }
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
