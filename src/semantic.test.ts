import { Analyzer as SyntaxAnalyzer } from './syntax'
import { Analyzer as SemanticAnalyzer } from './semantic'

async function parse(text : string) {
    const syntax_analyzer = new SyntaxAnalyzer
    const root = syntax_analyzer.analyze_text(text)
    const semantic_analyzer = new SemanticAnalyzer
    const file =  semantic_analyzer.analyze(root)

    return file
}

it(`Self assignment`, async () => {
    const file = await parse(`
        x = x
    `)

    expect(file.variables.toString()).toBe(
        `[local] x`
    )
})

it(`Literal assignment`, async () => {
    const file = await parse(`
        x = 1
    `)

    expect(file.variables.toString()).toBe(
        `[local] x\n` +
        `[literal] 1`
    )
})

it(`External assignment`, async () => {
    const file = await parse(`
        x = y
    `)

    expect(file.variables.toString()).toBe(
        `[local] x\n` +
        `[external] y`
    )
})

it(`Empty call`, async () => {
    const file = await parse(`
        f()
    `)

    expect(file.variables.toString()).toBe(
        `[external] f\n` +
        `[external] nothing\n` +
        `[unnamed]`
    )
})

it(`Named input call`, async () => {
    const file = await parse(`
        f(x)
    `)

    expect(file.variables.toString()).toBe(
        `[external] f\n` +
        `[external] x\n` +
        `[unnamed]`
    )
})

it(`List input call`, async () => {
    const file = await parse(`
        f(x, x)
    `)

    expect(file.variables.toString()).toBe(
        `[external] f\n` +
        `[external] x\n` +
        `[unnamed]\n` +
        `[unnamed]`
    )
})

it(`Program returns literal`, async () => {
    const file = await parse(`
        program() 1
    `)

    expect(file.variables.toString()).toBe(
        `[literal] 1\n` +
        `[unnamed]`
    )
})

it(`Program returns external`, async () => {
    const file = await parse(`
        program() x
    `)

    expect(file.variables.toString()).toBe(
        `[external] x\n` +
        `[unnamed]`
    )
})

it(`Factorial`, async () => {
    await parse(`
        fact = program(x) {
            if __le__(x, 1) then return 1

            return __mul__( x, fact(x) )
        }
    `)
})
