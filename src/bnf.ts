import { assert_never } from './utilities'

abstract class Expression {
//     public abstract get_class_name(visited : Set<Expression>) : string | null;
//
//     public get class_name()  {
//         return this.get_class_name(new Set)
//     }
//     public get constructor_name() {
//         const { class_name } = this
//
//         return class_name != null ? class_name : `Expression`
//     }
}

export class RuleExpression extends Expression {
    public static readonly symbol = Symbol(`bnf.RuleExpression.symbol`)

    private _expression : ExpressionUnion | null

    public readonly class_name : string | null
    public readonly name       : string

    public constructor({
        class_name = null,
        name,
        expression = null,
    } : {
        name        : string
        class_name? : string | null
        expression? : ExpressionUnion | null
    }) {
        super()

        this.class_name  = class_name
        this.name        = name
        this._expression = expression
    }

    public get symbol() : typeof RuleExpression.symbol {
        return RuleExpression.symbol
    }

    public get exports_name() {
        return to_pascal_case(this.name)
    }
    public get parser_name() {
        return `parse_${this.name}`
    }
    public get expression() {
        if (!this._expression) throw new Error // @todo

        return this._expression
    }
    public set expression(expression : ExpressionUnion) {
        if (this._expression) throw new Error // @todo

        this._expression = expression
    }
    public get fields() {
        const fields : FieldExpression[] = []

        function scan(exp : ExpressionUnion) : unknown {
            switch (exp.symbol) {
                case RuleExpression.symbol     : return // do nothing
                case SequenceExpression.symbol : return // do nothing
                case OptionalExpression.symbol : return // do nothing
                case TextExpression.symbol     : return // do nothing
                case RangeExpression.symbol    : return // do nothing
                case AndExpression.symbol      : return exp.expressions.forEach(scan)
                case OrExpression.symbol       : return // do nothing
                case FieldExpression.symbol    : return fields.push(exp)
                default: assert_never(exp, new Error) // @todo
            }
        }

        scan(this.expression)

        return fields
    }

//     public get_class_name(visited: Set<Expression>): string | null {
//         if (visited.has(this)) return null
//
//         visited.add(this)
//
//         return this._class_name != null
//             ? this._class_name
//             : this.expression.get_class_name(visited)
//     }
}

abstract class WrapperExpression extends Expression {
    public readonly expression : ExpressionUnion

    public constructor({ expression } : { expression : ExpressionUnion }) {
        super()

        this.expression = expression
    }
}

export class SequenceExpression extends WrapperExpression {
    public static readonly symbol = Symbol(`bnf.SequenceExpression.symbol`)

    public get symbol() : typeof SequenceExpression.symbol {
        return SequenceExpression.symbol
    }

    // public get_class_name(visited: Set<Expression>): string | null {
    //     return `(${this.expression.get_class_name(visited)})[]`
    // }
}

export class OptionalExpression extends WrapperExpression {
    public static readonly symbol = Symbol(`bnf.OptionalExpression.symbol`)

    public get symbol() : typeof OptionalExpression.symbol {
        return OptionalExpression.symbol
    }

    // public get_class_name(visited: Set<Expression>): string | null {
    //     return `(${this.expression.get_class_name(visited)} | null)`
    // }
}

export class TextExpression extends Expression {
    public static readonly symbol = Symbol(`bnf.TextExpression.symbol`)

    public readonly value : string

    public constructor({ value } : { value : string }) {
        super()

        this.value = value
    }

    public get symbol() : typeof TextExpression.symbol {
        return TextExpression.symbol
    }

    // public get_class_name(visited: Set<Expression>) {
    //     return null
    // }
}

export class RangeExpression extends Expression {
    public static readonly symbol = Symbol(`bnf.RangeExpression.symbol`)

    public readonly intervals : [number,number][]

    public constructor({ intervals } : { intervals : [number,number][] }) {
        super()

        this.intervals = intervals.map(x => [ ...x ]) // copy
    }

    public get symbol() : typeof RangeExpression.symbol {
        return RangeExpression.symbol
    }

    // public get_class_name(visited: Set<Expression>) {
    //     return null
    // }
}

abstract class CollectionExpression extends Expression {
    public readonly expressions : readonly ExpressionUnion[]

    public constructor({ expressions } : { expressions : readonly ExpressionUnion[] }) {
        super()

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

//     public get_class_name(visited: Set<Expression>): string | null {
//         const expressions = this.expressions
//             .map(x => x.get_class_name(visited))
//             .filter((x) : x is string => x !== null)
//
//         return expressions.length > 0
//             ? `[ ${expressions.join(`, `)} ]`
//             : null
//     }
}

export class OrExpression extends CollectionExpression {
    public static readonly symbol = Symbol(`bnf.OrExpression.symbol`)

    public get symbol() : typeof OrExpression.symbol {
        return OrExpression.symbol
    }

//     public get_class_name(visited: Set<Expression>): string | null {
//         const expressions = this.expressions
//             .map(x => x.get_class_name(visited))
//             .filter((x) : x is string => x !== null)
//
//         return expressions.length > 0
//             ? `(${expressions.join(` | `)})`
//             : null
//     }
}

export class FieldExpression extends Expression {
    public static readonly symbol = Symbol(`bnf.FieldExpression.symbol`)

    public readonly name       : string
    public readonly expression : ExpressionUnion

    public constructor({
        name,
        expression,
    } : {
        name       : string
        expression : ExpressionUnion
    }) {
        super()

        this.name       = name
        this.expression = expression
    }

    public get symbol() : typeof FieldExpression.symbol {
        return FieldExpression.symbol
    }

    // public get_class_name(visited: Set<Expression>): string | null {
    //     return this.expression.get_class_name(visited)
    // }
}

export type ExpressionUnion =
    | RuleExpression
    | SequenceExpression
    | OptionalExpression
    | TextExpression
    | RangeExpression
    | AndExpression
    | OrExpression
    | FieldExpression

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
            else if (exp.symbol === SequenceExpression.symbol) {
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
            else if (exp.symbol === FieldExpression.symbol) {
                throw new Error // @todo
            }
            else assert_never(exp, new Error) // @todo
        }

        return process(root.expression) === text.length
    }
}

export function rule(name : string) : RuleExpression;
export function rule(name : string, expression : ExpressionUnion | null) : RuleExpression;
export function rule(class_name : string, name : string, expression : ExpressionUnion | null) : RuleExpression;
export function rule(...params : [ string ] | [string, ExpressionUnion | null] | [string, string, ExpressionUnion | null]) {
    switch (params.length) {
        case 1: {
            const [ name ] = params

            return new RuleExpression({ name })
        } break
        case 2: {
            const [ name, expression ] = params

            return new RuleExpression({ name, expression })
        } break
        case 3: {
            const [ class_name, name, expression ] = params

            return new RuleExpression({ name, class_name, expression })
        } break
        default: assert_never(params, new Error) // @todo
    }
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

export function seq(expression : ExpressionUnion) {
    return new SequenceExpression({ expression })
}

export function opt(expression : ExpressionUnion) {
    return new OptionalExpression({ expression })
}

export function field(name : string, expression : ExpressionUnion) {
    return new FieldExpression({ name,  expression })
}

function tab1(text : string, level = 1) {
    return text.replace(/\n/g, `\n` + `    `.repeat(level))
}

function get_return_type(exp : ExpressionUnion) {
    const visited = new Set<RuleExpression>()

    function wrap_visit(exp : ExpressionUnion) {
        const result = visit(exp)

        return result != null && exp.symbol === OrExpression.symbol
            ? `(${result})`
            : result
    }

    function visit(exp : ExpressionUnion) : string | null {
        switch (exp.symbol) {
            case RuleExpression.symbol     : {
                if (visited.has(exp)) return null

                visited.add(exp)

                if (exp.class_name != null) return exp.class_name

                return visit(exp.expression)
            } break
            case SequenceExpression.symbol : {
                const target = wrap_visit(exp.expression)

                return target != null
                    ? `${target}[]`
                    : null
            } break
            case OptionalExpression.symbol : {
                const target = visit(exp.expression)

                return target != null
                    ? `${target} | null`
                    : null
            } break
            case TextExpression.symbol     : return null
            case RangeExpression.symbol    : return null
            case AndExpression.symbol      : {
                const exps = exp.expressions
                    .map(visit)
                    .filter((x) : x is string => x != null)

                return exps.length > 0
                    ? `[ ${exps.join(`, `)} ]`
                    : null
            } break
            case OrExpression.symbol       : {
                const exps = exp.expressions
                    .map(visit)
                    .filter((x) : x is string => x != null)

                    return exps.length > 0
                        ? exps.join(` | `)
                        : null
            } break
            case FieldExpression.symbol    : return visit(exp.expression)
            default: assert_never(exp, new Error) // @todo
        }
    }

    return wrap_visit(exp)
}

function scan_rules(root : RuleExpression) {
    const rules : RuleExpression[] = []

    function scan(exp : ExpressionUnion) : unknown {
        switch (exp.symbol) {
            case RuleExpression.symbol     : {
                if (rules.includes(exp)) return

                rules.push(exp)

                scan(exp.expression)
            } break
            case SequenceExpression.symbol : return scan(exp.expression)
            case OptionalExpression.symbol : return scan(exp.expression)
            case TextExpression.symbol     : return // do nothing
            case RangeExpression.symbol    : return // do nothing
            case AndExpression.symbol      : return exp.expressions.forEach(scan)
            case OrExpression.symbol       : return exp.expressions.forEach(scan)
            case FieldExpression.symbol    : return scan(exp.expression)
            default: assert_never(exp, new Error) // @todo
        }
    }

    scan(root)

    return rules
}

export function stringify_tree(root : RuleExpression) {
    const rules = scan_rules(root)

    return (
        CLASSES +
        `\n` +
        rules
            .filter(rule => rule.class_name !== null)
            .map(stringify_class)
            .join(`\n`) +
        `\n` +
        rules
            .map(stringify_parser)
            .join(`\n`) +
        `\n` +
        `export{}\n`
    )
}

function stringify_class(rule : RuleExpression) {
    const { class_name, fields } = rule

    return (
        `class ${class_name} extends Expression {\n` +
        `    public static readonly symbol = Symbol("${class_name}.symbol")\n` +
        `    \n` +
        (fields.length > 0 ?
        fields.map(field =>
        `    public readonly ${field.name} : ${get_return_type(field)}\n`
        ).join(``) +
        `    \n`
        : ``) +
        (fields.length > 0 ?
        `    public constructor({\n` +
        fields.map(field =>
        `        ${field.name},\n`
        ).join(``) +
        `        begin,\n` +
        `        end,\n` +
        `    } : {\n` +
        fields.map(field =>
        `        ${field.name} : ${get_return_type(field)}\n`
        ).join(``) +
        `        begin : Location\n` +
        `        end   : Location\n` +
        `    }) {\n` +
        `        super({ begin, end })\n` +
        `        \n` +
        fields.map(field =>
        `        this.${field.name} = ${field.name}\n`
        ).join(``) +
        `    }\n` +
        `    \n`
        : ``) +
        `    public get symbol() : typeof ${class_name}.symbol {\n` +
        `        return ${class_name}.symbol\n` +
        `    }\n` +
        `}\n` +
        ``
    )
}

function stringify_parser(rule : RuleExpression) {
    const { fields } = rule
    let class_name = get_return_type(rule)

    if (class_name == null) class_name = `Expression`

    return (
        `export function ${rule.parser_name}(text : string, begin = 0) : ${class_name} | null {\n` +
        `    const res = ${tab1(stringify_expression(rule.expression))}\n` +
        `    \n` +
        `    if (!res) return null\n` +
        `    \n` +
        (class_name != null && fields.length > 0 ?
        fields.map(field =>
        `    const ${field.name} = res${find_expression(field, rule.expression)}\n`
        ).join(``) +
        `    \n`
        : ``) +
        `    return new ${class_name}({\n` +
        (class_name != null ?
        fields.map(field =>
        `        ${field.name},\n`
        ).join(``)
        : ``) +
        `        begin : res.begin,\n` +
        `        end   : res.end,\n` +
        `    })\n` +
        `}\n`
    )
}

function stringify_expression(exp : ExpressionUnion, begin = `begin`) : string {
    switch (exp.symbol) {
        case RuleExpression.symbol     : return stringify_rule(exp, begin)
        case SequenceExpression.symbol : return stringify_sequence(exp, begin)
        case OptionalExpression.symbol : throw new Error
        case TextExpression.symbol     : return stringify_text(exp, begin)
        case RangeExpression.symbol    : return stringify_range(exp, begin)
        case AndExpression.symbol      : return stringify_and(exp, begin)
        case OrExpression.symbol       : return stringify_or(exp, begin)
        case FieldExpression.symbol    : return stringify_field(exp, begin)
        default: assert_never(exp, new Error) // @todo
    }
}

function stringify_rule(exp : RuleExpression, begin = `begin`) {
    return (
        `${exp.parser_name}(text, ${begin})`
    )
}

function stringify_sequence(exp : SequenceExpression, begin = `begin`) {
    const result = get_return_type(exp)

    return (
        `(begin => {\n` +
        (result != null ?
            `    const expressions : ${result} = []\n`
        : ``) +
        `    let end = begin\n` +
        `    \n` +
        `    while (true) {\n` +
        `        const res = ${tab1(stringify_expression(exp.expression, `end`), 2)}\n` +
        `        \n` +
        (result != null ?
        `        if (res == null) return new ArrayExpression({\n` +
        `            expressions,\n` +
        `            begin : new Location({ offset : begin }),\n` +
        `            end   : new Location({ offset : end }),\n` +
        `        })\n` :
        `        if (res == null) return new Expression({\n` +
        `            begin : new Location({ offset : begin }),\n` +
        `            end   : new Location({ offset : end }),\n` +
        `        })\n`) +
        `        \n` +
        (result != null ?
        `        expressions.push(res)\n`
        : ``) +
        `        end  = res.end.offset\n` +
        `    }\n` +
        `})(${begin})`
    )
}

function stringify_text(exp : TextExpression, begin = `begin`) {
    const { value } = exp

    return (
        `(text.substring(${begin}, ${begin} + ${value.length}) === ${JSON.stringify(value)} \n` +
        `    ? new Expression({\n` +
        `        begin : new Location({ offset : ${begin} }),\n` +
        `        end   : new Location({ offset : ${begin} + ${value.length} }),\n` +
        `    })\n` +
        `    : null)`
    )
}

function stringify_range(exp : RangeExpression, begin = `begin`) {
    return (
        `(begin => {\n` +
        `    const x = text.charCodeAt(begin)\n` +
        `    \n` +
        `    return ${tab1(stringify_range_condition(exp))}\n` +
        `        ? new Expression({\n` +
        `            begin : new Location({ offset : begin }),\n` +
        `            end   : new Location({ offset : begin + 1 }),\n` +
        `        })\n` +
        `        : null\n` +
        `})(${begin})`
    )
}

function stringify_range_condition(exp : RangeExpression, x = `x`) {
    // @todo: optimize via binary search?
    return (
        `(\n` +
        exp.intervals.map(([ b, e ]) =>
        `    (${x} >= ${b} && ${x} <= ${e})`
        ).join(` ||\n`) + `\n` +
        `)`
    )
}

function stringify_and(exp : AndExpression, begin = `begin`) {
    const exps = exp.expressions

    return (
        `(begin => {\n` +
        exps.map((exp, i) =>
        `    const res${i} = ${tab1(stringify_expression(exp, i > 0 ? `res${i - 1}.end.offset` : `begin`))}\n` +
        `    \n` +
        `    if (!res${i}) return null\n`
        ).join(`\n`) +
        `    \n` +
        `    return new TupleExpression({\n` +
        `        expressions : [\n` +
        exps.map((_, i) =>
        `            res${i},\n`
        ).join(``) +
        `        ] as const,\n` +
        `    })\n` +
        `})(${begin})`
    )
}

function stringify_or(exp : OrExpression, begin = `begin`) {
    const exps = exp.expressions

    return (
        `(begin => {\n` +
        exps.map((exp, i) =>
        `    const res${i} = ${tab1(stringify_expression(exp, `begin`))}\n` +
        `    \n` +
        `    if (res${i}) return res${i}\n`
        ).join(`\n`) +
        `    \n` +
        `    return null\n` +
        `})(${begin})`
    )
}

function stringify_field(exp : FieldExpression, begin = `begin`) {
    return stringify_expression(exp.expression, begin)
}

function find_expression(target : ExpressionUnion, root : ExpressionUnion) : string | null {
    if (target === root) return ``

    switch (root.symbol) {
        case RuleExpression.symbol     : return null
        case SequenceExpression.symbol : return null
        case OptionalExpression.symbol : return null
        case TextExpression.symbol     : return null
        case RangeExpression.symbol    : return null
        case AndExpression.symbol      : {
            for (let i = 0; i < root.expressions.length; ++i) {
                if (find_expression(target, root.expressions[i]) !== null) return `.expressions[${i}]`
            }

            return null
        }
        case OrExpression.symbol       : return null
        case FieldExpression.symbol    : return null
        default: assert_never(root, new Error) // @todo
    }
}

function to_pascal_case(text : string) {
    return text.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();})
}

const CLASSES = (
    `class Location {\n` +
    `    public readonly offset : number\n` +
    `    // public readonly line   = 0\n` +
    `    // public readonly column = 0\n` +
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
    `}\n` +
    `\n` +
    `class TupleExpression<Expressions extends readonly Expression[]> extends Expression {\n` +
    `    public readonly expressions : Expressions\n` +
    `    \n` +
    `    public constructor({\n` +
    `        expressions,\n` +
    `    } : {\n` +
    `        expressions : Expressions\n` +
    `    }) {\n` +
    `        super({\n` +
    `            begin : expressions[0].begin,\n` +
    `            end   : expressions[expressions.length - 1].end,\n` +
    `        })\n` +
    `        \n` +
    `        this.expressions = expressions\n` +
    `    }\n` +
    `}\n` +
    `\n` +
    `class ArrayExpression<Expression_> extends Expression {\n` +
    `    public readonly expressions : Expression_[]\n` +
    `    \n` +
    `    public constructor({\n` +
    `        expressions,\n` +
    `        begin,\n` +
    `        end,\n` +
    `    } : {\n` +
    `        expressions : Expression_[]\n` +
    `        begin       : Location\n` +
    `        end         : Location\n` +
    `    }) {\n` +
    `        super({ begin, end })\n` +
    `        \n` +
    `        this.expressions = expressions\n` +
    `    }\n` +
    `}\n` +
    `\n`
)
