import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'

async function parse(text : string) {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer

    return semantic_analyzer.analyze_file(root)
}

it(`Name assignment`, async () => {
    expect((await parse(`x = 5`)).variables.names).toMatchObject([
        { text : `x` },
    ])
})

it(`List assignment`, async () => {
    expect((await parse(`x, y = 5`)).variables.names).toMatchObject([
        { text : `x` },
        { text : `y` },
    ])
})
