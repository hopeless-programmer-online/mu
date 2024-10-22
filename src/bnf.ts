import { assert_never } from './utilities'

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
