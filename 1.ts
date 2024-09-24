import { inspect } from 'util'
import * as path from 'path'
import { readFile } from 'fs-extra'
import { Grammars, IToken } from 'ebnf'

type File = {
    type       : `file`
    statements : Statement[]
}

type Name = {
    type : `name`
    text : string
}

type Block = {
    type       : `block`
    statements : Statement[]
}

type Program = {
    type      : `program`
    arguments : string[]
    body      : Expression
}

type Call = {
    type       : `call`
    target     : Expression
    parameters : Expression[]
}

type Assignment = {
    type    : `assignment`
    outputs : Name[]
    target  : Expression
}

type Expression = Name | Call | Assignment

type Statement = Expression

function parse_file(token : IToken) : File {
    if (token.type !== `file`) throw new Error
    if (token.children.length !== 1) throw new Error

    const statements = parse_statements(token.children[0])

    return { type : `file`, statements }
}

function parse_statements(token : IToken) {
    if (token.type !== `stats`) throw new Error

    return token.children.map(parse_statement)
}

function parse_statement(token : IToken) {
    if (token.type !== `stat`) throw new Error
    if (token.children.length !== 1) throw new Error

    return parse_expression(token.children[0])
}

function parse_expression(token : IToken) {
    if (token.type !== `expr`) throw new Error
    if (token.children.length !== 1) throw new Error

    token = token.children[0]

    switch (token.type) {
        case `term` : return parse_terminal(token)
        case `call` : return parse_call(token)
        case `ass`  : return parse_assignment(token)
    }

    throw new Error
}

function parse_terminal(token : IToken) {
    if (token.type !== `term`) throw new Error
    if (token.children.length !== 1) throw new Error

    token = token.children[0]

    switch (token.type) {
        case `name`: return parse_name(token)
    }

    throw new Error
}

function parse_call(token : IToken) : Call {
    if (token.type !== `call`) throw new Error
    if (token.children.length < 1) throw new Error

    const target = parse_terminal(token.children[0])
    const parameters = token.children.slice(1).map(parse_expression)

    return { type : `call`, target, parameters }
}

function parse_assignment(token : IToken) : Assignment {
    if (token.type !== `ass`) throw new Error
    if (token.children.length < 2) throw new Error

    const outputs = token.children.slice(0, -1).map(parse_name)
    const target = parse_expression(token.children[token.children.length - 1])

    return { type : `assignment`, outputs, target }
}

function parse_name(token : IToken) : Name {
    if (token.type !== `name`) throw new Error

    return { type : `name`, text : token.text }
}

// function parse_program() {
//     // 
// }

async function read_file(uri : string) {
    return await readFile(path.join(__dirname, uri), `utf-8`)
}

function visit(token : IToken, i = 0) : any {
    const { type, children } = token

    console.log(`${``.padStart(i*2, `  `)}${type}:`)
    
    for (const x of children) visit(x, i + 1)
}

export default async function main() {
    const text    = await read_file(`1.mu`)

    // console.log(text)

    const grammar = await read_file(`grammar.ebnf`)
    const parser  = new Grammars.W3C.Parser(grammar)
    const tree    = parser.getAST(text)

    visit(tree)

    const file = parse_file(tree)

    console.log(inspect(file, { depth : 10 }))
    console.log(`done`)
}

main()
