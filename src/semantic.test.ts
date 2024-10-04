import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'
import * as semantic from './semantic'

async function parse(text : string) {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer
    const file =  semantic_analyzer.analyze(root)

    function get_name(x : semantic.VariableUnion) : string {
        if (x.symbol === semantic.NamedVariable.symbol) return x.name.text
        else if (x.symbol === semantic.LiteralVariable.symbol) return `<${x.literal.text}>`
        else if (x.symbol === semantic.UnnamedVariable.symbol) return `[unnamed]`
        else if (x.symbol === semantic.ClosureVariable.symbol) return get_name(x.source)
        else if (x.symbol === semantic.UndeclaredVariable.symbol) return get_name(x.value)
        else if (x.symbol === semantic.ExternalVariable.symbol) return x.name.text
        else ((never : never) : never => { throw new Error })(x)
    }

    // console.log(file.variables.map(get_name).join(`\n`))

    return file
}

it(`Empty`, async () => {
    expect((await parse(``)).variables.length).toBe(0)
})

it(`Literal (integer)`, async () => {
    expect((await parse(`5`)).variables.length).toBe(1)
})

it(`Name assignment (integer)`, async () => {
    expect((await parse(`x = 5`)).variables.length).toBe(2)
})

it(`Call`, async () => {
    expect((await parse(`f()`)).variables.length).toBe(3)
})

it(`Return`, async () => {
    expect((await parse(`return 5`)).variables.length).toBe(1)
})

it(`If`, async () => {
    expect((await parse(`if 1 then return 5`)).variables.length).toBe(2)
})

it(`Block`, async () => {
    expect((await parse(`{}`)).variables.length).toBe(0)
})

it(`Program`, async () => {
    expect((await parse(`program(){}`)).variables.length).toBe(1)
})

it(`Factoriel`, async () => {
    expect((await parse(
        `fact = program(x) {\n` +
        `    if __less__(x, 1) then return 1\n` +
        `    \n` +
        `    return __mul__(x, fact(__sub__(x, 1)))\n` +
        `}`
    )).variables.length).toBe(7)
})
