import { join as join_path } from 'path'
import { readFile, writeFile } from 'fs-extra'

export default async function main() {
    const text = await readFile(join_path(__dirname, `grammar.ebnf`), `utf8`)
    const ts = (
        `const grammar = \`\\\n` +
        text +
        `\`\n` +
        `export default grammar\n`
    )

    await writeFile(join_path(__dirname, `grammar.ts`), ts)

    console.log(`done`)
}

main()
