import { Analyzer } from './syntax'

async function parse(text : string) {
    const analyzer = await Analyzer.create()

    return analyzer.analyze_text(text)
}

it(`Variable`, async () => {
    expect(await parse(`hello`)).toMatchObject({
        type       : `file`,
        statements : [
            { type : `name`, text : `hello` },
        ],
    })
})

it(`Integer literal`, async () => {
    expect(await parse(`123`)).toMatchObject({
        type       : `file`,
        statements : [
            { type : `integer`, text : `123` },
        ],
    })
})

it(`Expression group`, async () => {
    expect(await parse(`(123)`)).toMatchObject({
        type       : `file`,
        statements : [
            { type : `integer`, text : `123` },
        ],
    })
})

it(`Call without inputs`, async () => {
    expect(await parse(`f()`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `call`,
                target : { type : `name`, text : `f` },
                input  : { type : `empty` },
            },
        ],
    })
})

it(`Call with single input`, async () => {
    expect(await parse(`f(x)`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `call`,
                target : { type : `name`, text : `f` },
                input  : { type : `name`, text : `x` },
            },
        ],
    })
})

it(`Call with two inputs`, async () => {
    expect(await parse(`f(x, y)`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `call`,
                target : { type : `name`, text : `f` },
                input  : {
                    type        : `expression_list`,
                    expressions : [
                        { type : `name`, text : `x` },
                        { type : `name`, text : `y` },
                    ],
                },
            },
        ],
    })
})

it(`Single assignment`, async () => {
    expect(await parse(`x = x`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `assignment`,
                output : { type : `name`, text : `x` },
                input  : { type : `name`, text : `x` },
            },
        ],
    })
})

it(`Group assignment`, async () => {
    expect(await parse(`(x) = x`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `assignment`,
                output : { type : `name`, text : `x` },
                input  : { type : `name`, text : `x` },
            },
        ],
    })
})

it(`Double assignment`, async () => {
    expect(await parse(`x, y = x`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type   : `assignment`,
                output : {
                    type    : `target_list`,
                    targets : [
                        { type : `name`, text : `x` },
                        { type : `name`, text : `y` },
                    ],
                },
                input  : { type : `name`, text : `x` },
            },
        ],
    })
})

it(`Empty block`, async () => {
    expect(await parse(`{}`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type       : `block`,
                statements : [],
            },
        ],
    })
})

it(`Return`, async () => {
    expect(await parse(`return`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type       : `return`,
                expression : { type : `empty` } ,
            },
        ],
    })
})

it(`Branching`, async () => {
    expect(await parse(`if x then y`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type      : `if`,
                condition : { type : `name`, text : `x` },
                then      : { type : `name`, text : `y` },
            },
        ],
    })
})

it(`Empty program`, async () => {
    expect(await parse(`program() return`)).toMatchObject({
        type       : `file`,
        statements : [
            {   type     : `program`,
                argument : { type : `empty` },
                body     : { type : `return`, expression : { type : `empty` } },
            },
        ],
    })
})
