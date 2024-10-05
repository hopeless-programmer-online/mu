import { default as Wabt } from 'wabt'
import { join as join_path } from 'path'
import { readFile, writeFile } from 'fs-extra'
import { Analyzer as SyntaxAnalyzer } from './src/syntax'
import { Analyzer as SemanticAnalyzer } from './src/semantic'
import { Translator } from './src/wasm'
import { tab } from './src/utilities'

export default async function main() {
    const text = await readFile(join_path(__dirname, `1.mu`), `utf8`)
    const syntax_analyzer = await SyntaxAnalyzer.create()
    const root = syntax_analyzer.analyze_text(text)

    // console.log(inspect(root, { depth : 10 }))

    const semantic_analyzer = new SemanticAnalyzer
    const file =  semantic_analyzer.analyze(root)
    const translator = new Translator
    const main = translator.translate(file)
    const template = await readFile(join_path(__dirname, `src/wasm.wat`), `utf8`)
    const wat = template.replace(/    \(func \$main\)/, tab(main))

    // console.log(wat)

    await writeFile(join_path(__dirname, `1.wat`), wat)

    const wabt = await Wabt()
    const wasm = wabt.parseWat(`main.wat`, wat).toBinary({}).buffer
    const module = await WebAssembly.compile(wasm)
    const imports = {
        print : {
            int32(value : number) {
                process.stdout.write(`${value}`)
            },
            ascii(begin : number, length : number) {
                // console.log({ begin, length })

                const text = Buffer.from(memory.buffer)
                    .subarray(begin, begin + length)
                    .toString(`ascii`)

                process.stdout.write(`${text}`)
            },
        },
    }
    const instance = await WebAssembly.instantiate(module, imports)
    const { exports } = instance
    const memory = exports.memory as WebAssembly.Memory
    const result = (exports.main as () => number)()

    // console.log(result)
    console.log(`done`)
}

main()
