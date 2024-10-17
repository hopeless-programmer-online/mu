import { join as join_path } from 'path'
import { readFile, writeFile } from 'fs-extra'

async function prebuild_grammar() {
    const text = await readFile(join_path(__dirname, `grammar.ebnf`), `utf8`)
    const ts = (
        `const grammar = \`\\\n` +
        JSON.stringify(text).slice(1, -1) +
        `\`\n` +
        `export default grammar\n`
    )

    await writeFile(join_path(__dirname, `grammar.ts`), ts)
}

async function prebuild_engine() {
    const text = await readFile(join_path(__dirname, `engine.wat`), `utf8`)
    const ts = (
        `const engine = \`\\\n` +
        JSON.stringify(text).slice(1, -1) +
        `\`\n` +
        `export default engine\n`
    )

    await writeFile(join_path(__dirname, `engine.ts`), ts)
}

export default async function main() {
    await prebuild_grammar()
    await prebuild_engine()

    console.log(`done`)
}

main()
