import * as path from 'path'
import { readFile } from 'fs-extra'
import { Grammars } from 'ebnf'

async function read_file(uri : string) {
    return await readFile(path.join(__dirname, uri), `utf-8`)
}

export default async function main() {
    const text    = await read_file(`1.mu`)

    console.log(text)

    const grammar = await read_file(`grammar.ebnf`)
    const parser  = new Grammars.W3C.Parser(grammar)
    const tree    = parser.getAST(text)

    console.log(tree)
    console.log(`done`)
}

main()
