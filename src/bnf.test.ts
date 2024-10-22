import { Parser, rule, text, range, or, and, rep, opt } from './bnf'

it(``, () => {
    const a = rule(`a`, text(`a`))
    const parser = new Parser({ rules : [ a ] })

    expect(parser.parse(`a`)).toBe(true)
})

it(``, () => {
    const ab = rule(`ab`, or(
        text(`a`),
        text(`b`),
    ))
    const parser = new Parser({ rules : [ ab ] })

    expect(parser.parse(`a`)).toBe(true)
    expect(parser.parse(`b`)).toBe(true)
})

it(``, () => {
    const ab = rule(`ab`, and(
        text(`a`),
        text(`b`),
    ))
    const parser = new Parser({ rules : [ ab ] })

    expect(parser.parse(`ab`)).toBe(true)
    expect(parser.parse(`a`)).toBe(false)
    expect(parser.parse(`b`)).toBe(false)
})

it(``, () => {
    const az = rule(`az`, range(`az`))
    const parser = new Parser({ rules : [ az ] })

    expect(parser.parse(`a`)).toBe(true)
    expect(parser.parse(`b`)).toBe(true)
    expect(parser.parse(`c`)).toBe(true)
    expect(parser.parse(`y`)).toBe(true)
    expect(parser.parse(`z`)).toBe(true)

    expect(parser.parse(`A`)).toBe(false)
    expect(parser.parse(`Z`)).toBe(false)
    expect(parser.parse(`0`)).toBe(false)
    expect(parser.parse(`9`)).toBe(false)
    expect(parser.parse(`-`)).toBe(false)
})

it(``, () => {
    const letter = rule(`letter`, range(`az`, `AZ`, `__`))
    const symbol = rule(`symbol`, range(`az`, `AZ`, `__`, `09`))
    const name   = rule(`name`, and(letter, rep(symbol)))
    const parser = new Parser({ rules : [ name ] })

    expect(parser.parse(`a`)).toBe(true)
    expect(parser.parse(`snake_case`)).toBe(true)
    expect(parser.parse(`camelCase`)).toBe(true)
    expect(parser.parse(`PascalCase`)).toBe(true)
    expect(parser.parse(`0`)).toBe(false)
})

it(``, () => {
    const letter = rule(`letter`, range(`az`, `AZ`, `__`))
    const symbol = rule(`symbol`, range(`az`, `AZ`, `__`, `09`))
    const name   = rule(`name`, and(letter, rep(symbol)))
    const space  = rule(`space`, rep(range(`  `, `\n\n`, `\r\r`, `\t\t`)))
    const exp    = rule(`exp`)
    const line   = rule(`line`, and(name, space, text(`=`), space, exp))
    const file   = rule(`file`, and(space, rep(and(line, space))))

    exp.expression = name

    const parser = new Parser({ rules : [ file ] })

    expect(parser.parse(`
        exp = name
    `)).toBe(true)
})
