import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'

async function parse(text : string) {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer

    return semantic_analyzer.analyze_file(root)
}

it(`Empty`, async () => {
    expect((await parse(``)).frame.variables.length).toBe(0)
})

it(`Name assignment (integer)`, async () => {
    expect((await parse(`x = 5`)).frame.variables.length).toBe(2)
})

it(`Name assignment (name)`, async () => {
    expect((await parse(`x = y`)).frame.variables.length).toBe(2)
})

it(`List assignment`, async () => {
    expect((await parse(`x, y = 5`)).frame.variables.length).toBe(3)
})
