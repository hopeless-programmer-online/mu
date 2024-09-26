import { inspect } from 'util'
import { Analyzer as SyntaxAnalyzer } from './src/syntax'

export default async function main() {
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const file = await syntax_analyzer.analyze_file(`1.mu`)

    console.log(inspect(file, { depth : 10 }))
    console.log(`done`)
}

main()
