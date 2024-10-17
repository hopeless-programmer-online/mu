import { Analyzer } from './syntax'

async function parse(text : string) {
    const analyzer = new Analyzer

    return analyzer.analyze_text(text).toString()
}

it(`Empty file`, async () => {
    expect(await parse(``)).toBe(
        `\n`
    )
})

it(`Variable`, async () => {
    expect(await parse(`hello`)).toBe(
        `hello\n`
    )
})

it(`Integer literal`, async () => {
    expect(await parse(`123`)).toBe(
        `123\n`
    )
})

it(`Expression group`, async () => {
    expect(await parse(`(123)`)).toBe(
        `123\n`
    )
})

it(`Call without inputs`, async () => {
    expect(await parse(`f()`)).toBe(
        `f()\n`
    )
})

it(`Call with single input`, async () => {
    expect(await parse(`f(x)`)).toBe(
        `f(x)\n`
    )
})

it(`Call with two inputs`, async () => {
    expect(await parse(`f(x, y)`)).toBe(
        `f(x, y)\n`
    )
})

it(`Single assignment`, async () => {
    expect(await parse(`x = x`)).toBe(
        `x = x\n`
    )
})

it(`Program assignment`, async () => {
    expect(await parse(`x = program(){}`)).toBe(
        `x = program() {\n` +
        `}\n`
    )
})

it(`Group assignment`, async () => {
    expect(await parse(`(x) = x`)).toBe(
        `x = x\n`
    )
})

it(`Double assignment`, async () => {
    expect(await parse(`x, y = x`)).toBe(
        `x, y = x\n`
    )
})

it(`Empty block`, async () => {
    expect(await parse(`{}`)).toBe(
        `{\n` +
        `}\n`
    )
})

it(`Return`, async () => {
    expect(await parse(`return`)).toBe(
        `return\n`
    )
})

it(`Branching`, async () => {
    expect(await parse(`if x then y`)).toBe(
        `if x then y\n`
    )
})

it(`Empty program`, async () => {
    expect(await parse(`program() return`)).toBe(
        `program() return\n`
    )
})
