import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'

async function parse(text : string) {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer

    return semantic_analyzer.analyze(root)
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

/*it(`Name assignment (name)`, async () => {
    expect((await parse(`x = y`)).frame.variables.length).toBe(2)
})

it(`List assignment`, async () => {
    expect((await parse(`x, y = 5`)).frame.variables.length).toBe(3)
})*/
