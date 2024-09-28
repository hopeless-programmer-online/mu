import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'

async function parse(text : string) {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer

    // semantic_analyzer.analyze_file(root)
}

