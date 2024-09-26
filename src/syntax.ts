import { join as join_path } from 'path'
import { readFile } from 'fs-extra'
import { Grammars, IToken } from 'ebnf'

export type File = {
    type       : `file`
    statements : Statement[]
}

export type Name = {
    type : `name`
    text : string
}

export type Integer = {
    type : `integer`
    text : string
}

export type Block = {
    type       : `block`
    statements : Statement[]
}

export type Program = {
    type      : `program`
    arguments : Name[]
    body      : Expression
}

export type Call = {
    type       : `call`
    target     : Expression
    parameters : Expression[]
}

export type Assignment = {
    type    : `assignment`
    outputs : Name[]
    target  : Expression
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

export type Expression = Name | Call | Assignment | Program | Block | Integer

export type Statement = Expression | Return | If

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
        if (token.type !== `stats`) throw new Error

        return token.children.map(child => this.check_statement(child))
    }

    private check_statement(token : IToken) : Statement {
        if (token.type !== `stat`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]


        switch (token.type) {
            case `expr` : return this.check_expression(token)
            case `ret`  : return this.check_return(token)
            case `if`   : return this.check_if(token)
        }

        throw new Error(`Unexpected token type: ${token.type}`)
    }

    private check_return(token : IToken) : Return {
        if (token.type !== `ret`) throw new Error
        if (token.children.length !== 1) throw new Error

        return {
            type       : `return`,
            expression : this.check_expression(token.children[0]),
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

    private check_expression(token : IToken) {
        if (token.type !== `expr`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `term`  : return this.check_terminal(token)
            case `call`  : return this.check_call(token)
            case `ass`   : return this.check_assignment(token)
            case `prog`  : return this.check_program(token)
            case `block` : return this.check_block(token)
        }

        throw new Error
    }

    private check_terminal(token : IToken) {
        if (token.type !== `term`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `name`: return this.check_name(token)
            case `lit` : return this.check_literal(token)
        }

        throw new Error
    }

    private check_call(token : IToken) : Call {
        if (token.type !== `call`) throw new Error
        if (token.children.length < 1) throw new Error

        const target = this.check_terminal(token.children[0])
        const parameters = token.children.slice(1).map(child => this.check_expression(child))

        return { type : `call`, target, parameters }
    }

    private check_assignment(token : IToken) : Assignment {
        if (token.type !== `ass`) throw new Error
        if (token.children.length < 2) throw new Error

        const outputs = token.children.slice(0, -1).map(child => this.check_name(child))
        const target = this.check_expression(token.children[token.children.length - 1])

        return { type : `assignment`, outputs, target }
    }

    private check_name(token : IToken) : Name {
        if (token.type !== `name`) throw new Error

        return { type : `name`, text : token.text }
    }

    private check_literal(token : IToken) {
        if (token.type !== `lit`) throw new Error
        if (token.children.length !== 1) throw new Error

        token = token.children[0]

        switch (token.type) {
            case `int` : return this.check_integer(token)
        }

        throw new Error
    }

    private check_integer(token : IToken) : Integer {
        if (token.type !== `int`) throw new Error

        return { type : `integer`, text : token.text }
    }

    private check_program(token : IToken) : Program {
        if (token.type !== `prog`) throw new Error
        if (token.children.length != 2) throw new Error

        return {
            type      : `program`,
            arguments : this.check_arguments(token.children[0]),
            body      : this.check_expression(token.children[1]),
        }
    }

    private check_arguments(token : IToken) {
        if (token.type !== `args`) throw new Error

        return token.children.map(child => this.check_argument(child))
    }

    private check_argument(token : IToken) {
        if (token.type !== `arg`) throw new Error
        if (token.children.length != 1) throw new Error

        return this.check_name(token.children[0])
    }

    private check_block(token : IToken) : Block {
        if (token.type !== `block`) throw new Error

        return {
            type       : `block`,
            statements : token.children.map(child => this.check_statement(child)),
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
