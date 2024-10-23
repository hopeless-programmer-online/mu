import { assert_never, tab } from './utilities'

export class RuleExpression {
    public static readonly symbol = Symbol(`bnf.RuleExpression.symbol`)

    private         _expression : ExpressionUnion | null

    public readonly name        : string

    public constructor({
        name,
        expression = null,
    } : {
        name        : string
        expression? : ExpressionUnion | null
    }) {
        this.name        = name
        this._expression = expression
    }

    public get expression() {
        if (!this._expression) throw new Error // @todo

        return this._expression
    }
    public set expression(expression : ExpressionUnion) {
        if (this._expression) throw new Error // @todo

        this._expression = expression
    }

    public get symbol() : typeof RuleExpression.symbol {
        return RuleExpression.symbol
    }
}

class WrapperExpression {
    public readonly expression : ExpressionUnion

    public constructor({ expression } : { expression : ExpressionUnion }) {
        this.expression = expression
    }
}

export class RepeatExpression extends WrapperExpression {
    public static readonly symbol = Symbol(`bnf.RepeatExpression.symbol`)

    public get symbol() : typeof RepeatExpression.symbol {
        return RepeatExpression.symbol
    }
}

export class OptionalExpression extends WrapperExpression {
    public static readonly symbol = Symbol(`bnf.OptionalExpression.symbol`)

    public get symbol() : typeof OptionalExpression.symbol {
        return OptionalExpression.symbol
    }
}

export class TextExpression {
    public static readonly symbol = Symbol(`bnf.TextExpression.symbol`)

    public readonly value : string

    public constructor({ value } : { value : string }) {
        this.value = value
    }

    public get symbol() : typeof TextExpression.symbol {
        return TextExpression.symbol
    }
}

export class RangeExpression {
    public static readonly symbol = Symbol(`bnf.RangeExpression.symbol`)

    public readonly intervals : [number,number][]

    public constructor({ intervals } : { intervals : [number,number][] }) {
        this.intervals = intervals.map(x => [ ...x ]) // copy
    }

    public get symbol() : typeof RangeExpression.symbol {
        return RangeExpression.symbol
    }
}

class CollectionExpression {
    public readonly expressions : readonly ExpressionUnion[]

    public constructor({ expressions } : { expressions : readonly ExpressionUnion[] }) {
        this.expressions = [ ...expressions ] // copy
    }

    public * [Symbol.iterator]() {
        return yield * this.expressions
    }
}

export class AndExpression extends CollectionExpression {
    public static readonly symbol = Symbol(`bnf.AndExpression.symbol`)

    public get symbol() : typeof AndExpression.symbol {
        return AndExpression.symbol
    }
}

export class OrExpression extends CollectionExpression {
    public static readonly symbol = Symbol(`bnf.OrExpression.symbol`)

    public get symbol() : typeof OrExpression.symbol {
        return OrExpression.symbol
    }
}

export type ExpressionUnion =
    | RuleExpression
    | RepeatExpression
    | OptionalExpression
    | TextExpression
    | RangeExpression
    | AndExpression
    | OrExpression

export class ParserGenerator {
    public generate(root : ExpressionUnion) {
        const rules : RuleExpression[] = []

        function scan(exp : ExpressionUnion) {
            if (exp.symbol === RuleExpression.symbol) {
                if (rules.includes(exp)) return

                rules.push(exp)

                scan(exp.expression)
            }
            else if (exp.symbol === RepeatExpression.symbol) {
                scan(exp.expression)
            }
            else if (exp.symbol === OptionalExpression.symbol) {
                scan(exp.expression)
            }
            else if (exp.symbol === TextExpression.symbol) {
                // do nothing
            }
            else if (exp.symbol === RangeExpression.symbol) {
                // do nothing
            }
            else if (exp.symbol === AndExpression.symbol) {
                exp.expressions.forEach(scan)
            }
            else if (exp.symbol === OrExpression.symbol) {
                exp.expressions.forEach(scan)
            }
            else assert_never(exp, new Error) // @todo
        }

        scan(root)

        function stringify(exp : ExpressionUnion, begin = `begin`) : string {
            if (exp.symbol === RuleExpression.symbol) {
                return `parse_${exp.name}(text, ${begin})?.end.offset`
            }
            else if (exp.symbol === RepeatExpression.symbol) {
                return (
                    `(begin => {\n` +
                    `    let last = begin\n` +
                    `    \n` +
                    `    while (true) {\n` +
                    tab(`const end = ${stringify(exp.expression, `last`)}`, `        `) + `\n` +
                    `        if (end == null) return last\n` +
                    `        last = end\n` +
                    `    }\n` +
                    `})(${begin})`
                )
            }
            else if (exp.symbol === OptionalExpression.symbol) {
                return (
                    `(begin => {\n` +
                    `    const end = ${stringify(exp.expression)}\n` +
                    `    if (end != null) return end\n` +
                    `    return begin\n` +
                    `})(${begin})`
                )
            }
            else if (exp.symbol === TextExpression.symbol) {
                return `(begin => text.substring(begin, begin + ${exp.value.length}) === ${JSON.stringify(exp.value)} ? begin + ${exp.value.length} : null)(${begin})`
            }
            else if (exp.symbol === RangeExpression.symbol) {
                return (
                    `(begin => {\n` +
                    `    const x = text.charCodeAt(begin)\n` +
                    `    \n` +
                    `    return (\n` +
                    tab(exp.intervals
                        .map(([ a, b ]) =>
                            `(x >= ${a} && x <= ${b})`
                        )
                        .join(` ||\n`),
                        `        `
                    ) + `\n` +
                    `    ) ? begin + 1 : null\n` +
                    `})(${begin})`
                )
            }
            else if (exp.symbol === AndExpression.symbol) {
                return (
                    `(begin => {\n` +
                    `    let last = begin\n` +
                    `    \n` +
                    tab(exp.expressions
                        .map((x, i) =>
                            `const end${i} = ${stringify(x, `last`)}\n` +
                            `if (end${i} == null) return null\n` +
                            `last = end${i}\n`
                        )
                        .join(`\n`)
                    ) + `\n` +
                    `    return last\n` +
                    `})(${begin})`
                )
            }
            else if (exp.symbol === OrExpression.symbol) {
                return (
                    `(begin => {\n` +
                    tab(exp.expressions
                        .map((x, i) =>
                            `const end${i} = ${stringify(x)}\n` +
                            `if (end${i} != null) return end${i}\n`
                        )
                        .join(`\n`)
                    ) + `\n` +
                    `    return null\n` +
                    `})(${begin})`
                )
            }
            else assert_never(exp, new Error) // @todo
        }

        const header = (
            `class Location {\n` +
            `    public readonly offset : number\n` +
            `    public readonly line   = 0\n` +
            `    public readonly column = 0\n` +
            `    \n` +
            `    public constructor({\n` +
            `        offset,\n` +
            `    } : {\n` +
            `        offset : number\n` +
            `    }) {\n` +
            `        this.offset = offset\n` +
            `    }\n` +
            `}\n` +
            `\n` +
            `class Expression {\n` +
            `    public readonly begin : Location\n` +
            `    public readonly end   : Location\n` +
            `    \n` +
            `    public constructor({\n` +
            `        begin,\n` +
            `        end,\n` +
            `    } : {\n` +
            `        begin : Location\n` +
            `        end   : Location\n` +
            `    }) {\n` +
            `        this.begin = begin\n` +
            `        this.end   = end\n` +
            `    }\n` +
            `}\n`
        )

        const classes = rules
            .map(({ name }) => {
                const class_name = `${to_pascal_case(name)}Expression`

                return (
                    `export class ${class_name} extends Expression {\n` +
                    `    public static readonly symbol = Symbol("${class_name}.symbol")\n` +
                    `    \n` +
                    `    public get symbol() : typeof ${class_name}.symbol {\n` +
                    `        return ${class_name}.symbol\n` +
                    `    }\n` +
                    `}\n`
                )
            })
            .join(`\n`)

        const functions = rules
            .map(rule => {
                const class_name = `${to_pascal_case(rule.name)}Expression`

                return (
                    `export function parse_${rule.name}(text : string, begin : number) : ${class_name} | null {\n` +
                    tab(`const end = ${stringify(rule.expression)}\n`) +
                    `    \n` +
                    `    if (end == null) return null\n` +
                    `    \n` +
                    `    return new ${class_name}({\n` +
                    `        begin : new Location({ offset : begin }),\n` +
                    `        end   : new Location({ offset : end }),\n` +
                    `    })\n` +
                    `}\n`
                )
            })
            .join(`\n`)

        const exports = rules
            .map(({ name }) => {
                const class_name = `${to_pascal_case(name)}Expression`

                return (
                    `export { ${class_name} as ${to_pascal_case(name)} }\n`
                )
            })
            .join(`\n`)

        return (
            header +
            `\n` +
            classes +
            `\n` +
            functions +
            `\n` +
            exports
        )
    }
}

export class Parser {
    public readonly rules : readonly RuleExpression[]

    public constructor({ rules } : { rules : readonly RuleExpression[] }) {
        this.rules = rules
    }

    public parse(text : string) {
        const { rules } = this

        if (rules.length < 1) throw new Error // @todo

        const root = rules[0]

        function process(exp : ExpressionUnion, begin : number = 0) : number | false {
            if (exp.symbol === RuleExpression.symbol) return process(exp.expression, begin)
            else if (exp.symbol === RepeatExpression.symbol) {
                const { expression } = exp

                while (true) {
                    const end = process(expression, begin)

                    if (end === false) return begin

                    begin = end
                }
            }
            else if (exp.symbol === OptionalExpression.symbol) {
                const { expression } = exp
                const end = process(expression, begin)

                return end !== false ? end : begin
            }
            else if (exp.symbol === AndExpression.symbol) {
                let last = begin

                for (const child of exp) {
                    const end = process(child, last)

                    if (end === false) return false

                    last = end
                }

                return last
            }
            else if (exp.symbol === OrExpression.symbol) {
                for (const child of exp) {
                    const end = process(child, begin)

                    if (end !== false) return end
                }

                return false
            }
            else if (exp.symbol === TextExpression.symbol) {
                const { value, value : { length } } = exp
                const end = begin + length

                if (text.substring(begin, end) !== value) return false

                return end
            }
            else if (exp.symbol === RangeExpression.symbol) {
                const { intervals } = exp
                const code = text.charCodeAt(begin)

                if (intervals.some(([ min, max ]) => min <= code && code <= max)) return begin + 1

                return false
            }
            else assert_never(exp, new Error) // @todo
        }

        return process(root.expression) === text.length
    }
}

export function rule(name : string, expression : ExpressionUnion | null = null) {
    return new RuleExpression({ name, expression })
}

export function text(value : string) {
    return new TextExpression({ value })
}

export function range(...intervals : string[]) {
    return new RangeExpression({
        intervals : intervals.map(([ min, max ]) =>
            [ min.charCodeAt(0), max.charCodeAt(0) ]
        )
    })
}

export function or(...expressions : readonly ExpressionUnion[]) {
    return new OrExpression({ expressions })
}

export function and(...expressions : readonly ExpressionUnion[]) {
    return new AndExpression({ expressions })
}

export function rep(expression : ExpressionUnion) {
    return new RepeatExpression({ expression })
}

export function opt(expression : ExpressionUnion) {
    return new OptionalExpression({ expression })
}

function to_pascal_case(text : string) {
    return text.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();})
}
