import * as syntax from './syntax'
import { assert_never } from './utilities'

export class File {
    public static readonly symbol = Symbol(`syntax.File.symbol`)

    public readonly statements = new ExecutableStatements({ executable : this })
    public readonly variables  = new FrameVariables({ frame : this })

    public get symbol() : typeof File.symbol {
        return File.symbol
    }

    public get file() {
        return this
    }
    public get frame() {
        return this
    }
    public get programs() {
        const programs : Program[] = []
        const iterate = (statement : StatementUnion) => {
            if (statement.symbol === ProgramStatement.symbol) {
                programs.push(statement.program)

                statement.program.statements.array.forEach(iterate)
            }
            else if (statement.symbol === BlockStatement.symbol) {
                statement.statements.array.forEach(iterate)
            }
        }

        this.statements.array.forEach(iterate)

        return programs
    }
}

export class Program {
    public static readonly symbol = Symbol(`syntax.Program.symbol`)

    public readonly parent     : FrameUnion
    public readonly statements : ExecutableStatements = new ExecutableStatements({ executable : this })
    public readonly variables  : FrameVariables       = new FrameVariables({ frame : this })

    public constructor({ parent } : { parent : FrameUnion }) {
        this.parent = parent
    }

    public get symbol() : typeof Program.symbol {
        return Program.symbol
    }

    public get file() : File {
        return this.parent.file
    }
    public get frame() {
        return this
    }
    public get closure() {
        const filter = (variable : VariableUnion) : variable is ClosureVariable =>
            variable.symbol === ClosureVariable.symbol

        return this.variables.array.filter(filter)
    }
}

export type FrameUnion = File | Program
export type ExecutableUnion = File | Program | BlockStatement

export abstract class Statement {
    public readonly executable : ExecutableUnion

    public constructor({ executable } : { executable : ExecutableUnion }) {
        this.executable = executable
    }
}

type StatementParameters = ConstructorParameters<typeof Statement>[0]

export class BlockStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.BlockStatement.symbol`)

    public readonly parent     : ExecutableUnion | IfStatement
    public readonly statements = new ExecutableStatements({ executable : this })

    public constructor(params : StatementParameters & { parent : ExecutableUnion | IfStatement }) {
        super(params)

        this.parent = params.parent
    }

    public get symbol() : typeof BlockStatement.symbol {
        return BlockStatement.symbol
    }

    public get file() : File {
        return this.parent.file
    }
    public get frame() : FrameUnion {
        return this.parent.frame
    }
}

export class ReturnStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.ReturnStatement.symbol`)

    public readonly variable : VariableUnion

    public constructor(params : StatementParameters & { variable : VariableUnion }) {
        super(params)

        this.variable = params.variable
    }

    public get symbol() : typeof ReturnStatement.symbol {
        return ReturnStatement.symbol
    }
}

export class IfStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.IfStatement.symbol`)

    public readonly condition : VariableUnion
    public readonly then      : BlockStatement

    public constructor(params : StatementParameters & { condition : VariableUnion }) {
        super(params)

        this.condition = params.condition
        this.then      = new BlockStatement({ executable : params.executable, parent : this })
    }

    public get symbol() : typeof IfStatement.symbol {
        return IfStatement.symbol
    }

    public get file() : File {
        return this.then.parent.file
    }
    public get frame() : FrameUnion {
        return this.executable.frame
    }
}

export class AssignmentStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.AssignmentStatement.symbol`)

    public readonly input  : VariableUnion
    public readonly output : VariableUnion

    public constructor(params : StatementParameters & { input : VariableUnion, output : VariableUnion }) {
        super(params)

        this.input  = params.input
        this.output = params.output
    }

    public get symbol() : typeof AssignmentStatement.symbol {
        return AssignmentStatement.symbol
    }
}

export class CallStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.CallStatement.symbol`)

    public readonly target : VariableUnion
    public readonly input  : VariableUnion
    public readonly output : VariableUnion

    public constructor(params : StatementParameters & {
        target : VariableUnion
        input  : VariableUnion
        output : VariableUnion
    }) {
        super(params)

        this.target = params.target
        this.input  = params.input
        this.output = params.output
    }

    public get symbol() : typeof CallStatement.symbol {
        return CallStatement.symbol
    }
}

export class ProgramStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.ProgramStatement.symbol`)

    public readonly program  : Program
    public readonly variable : VariableUnion

    public constructor(params : StatementParameters & { program : Program, variable : VariableUnion }) {
        super(params)

        this.program  = params.program
        this.variable = params.variable
    }

    public get symbol() : typeof ProgramStatement.symbol {
        return ProgramStatement.symbol
    }
}

export class PackStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.PackStatement.symbol`)

    public readonly output : VariableUnion
    public readonly inputs : VariableUnion[]

    public constructor(params : StatementParameters & { output : VariableUnion, inputs : VariableUnion[] }) {
        super(params)

        this.output = params.output
        this.inputs = params.inputs
    }

    public get symbol() : typeof PackStatement.symbol {
        return PackStatement.symbol
    }
}

export class UnpackStatement extends Statement {
    public static readonly symbol = Symbol(`syntax.UnpackStatement.symbol`)

    public readonly input   : VariableUnion
    public readonly outputs : VariableUnion[]

    public constructor(params : StatementParameters & { input : VariableUnion, outputs : VariableUnion[] }) {
        super(params)

        this.input   = params.input
        this.outputs = params.outputs
    }

    public get symbol() : typeof UnpackStatement.symbol {
        return UnpackStatement.symbol
    }
}

export type StatementUnion = BlockStatement | ReturnStatement | IfStatement | AssignmentStatement | CallStatement | ProgramStatement | PackStatement | UnpackStatement

export class ExecutableStatements {
    private readonly _array : StatementUnion[] = []

    public readonly executable : ExecutableUnion

    public constructor({ executable } : { executable : ExecutableUnion }) {
        this.executable = executable
    }

    public get array() : readonly StatementUnion[] {
        return this._array
    }

    private assert_frame(variable : VariableUnion) {
        if (variable.frame !== this.executable.frame) throw new Error
    }
    private add<T extends StatementUnion>(statement : T) {
        this._array.push(statement)

        return statement
    }

    public add_assignment(output : VariableUnion, input : VariableUnion) {
        this.assert_frame(output)
        this.assert_frame(input)

        const { executable } = this

        return this.add(new AssignmentStatement({ input, output, executable }))
    }
    public add_call(target : VariableUnion, input : VariableUnion) {
        this.assert_frame(target)
        this.assert_frame(input)

        const output = this.executable.frame.variables.add_unnamed()
        const { executable } = this

        return this.add(new CallStatement({ target, input, output, executable }))
    }
    public add_pack(inputs : VariableUnion[]) {
        const output = this.executable.frame.variables.add_unnamed()
        const { executable } = this

        return this.add(new PackStatement({ inputs, output, executable }))
    }
    public add_program(program : Program) {
        const variable = this.executable.frame.variables.add_unnamed()
        const { executable } = this

        return this.add(new ProgramStatement({ program, variable, executable }))
    }
    public add_block() {
        const { executable } = this

        return this.add(new BlockStatement({ parent : executable, executable }))
    }
    public add_return(variable : VariableUnion) {
        this.assert_frame(variable)

        const { executable } = this

        return this.add(new ReturnStatement({ variable, executable }))
    }
    public add_if(condition : VariableUnion) {
        const { executable } = this

        return this.add(new IfStatement({ condition, executable }))
    }
    public add_unpack(input : VariableUnion, outputs : VariableUnion[]) {
        const { executable } = this

        return this.add(new UnpackStatement({ input, outputs, executable }))
    }
}

/** Basic class for all variables. */
abstract class Variable {
    public readonly frame : FrameUnion

    public constructor({ frame } : { frame : FrameUnion }) {
        this.frame = frame
    }

    public abstract is_equal(other : VariableUnion) : boolean
    public abstract toString() : string
}

/** Variable that holds value for a literal. */
export class LiteralVariable extends Variable {
    public static readonly symbol = Symbol(`syntax.LiteralVariable.symbol`)

    public readonly literal : syntax.LiteralUnion

    public constructor({ literal, frame } : { literal : syntax.LiteralUnion, frame : FrameUnion }) {
        super({ frame })

        this.literal = literal
    }

    public get symbol() : typeof LiteralVariable.symbol {
        return LiteralVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            other.symbol === LiteralVariable.symbol && other.literal.is_equal(this.literal) ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public sanity_check() {
        // Only file can has literals
        if (this.frame.symbol !== File.symbol) throw new Error // @todo
    }
    public toString() {
        return `[literal] ${this.literal}`
    }
}

/** Result of an intermediate expression. */
export class UnnamedVariable extends Variable {
    public static readonly symbol = Symbol(`syntax.UnnamedVariable.symbol`)

    public get symbol() : typeof UnnamedVariable.symbol {
        return UnnamedVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public toString() {
        return `[unnamed]`
    }
}

/** Basic class for all named variables. */
export abstract class NamedVariable extends Variable {
    public readonly name : string

    public constructor({ name, frame } : { name : string, frame : FrameUnion }) {
        super({ frame })

        this.name = name
    }
}

/** Global variable that is used but never declared or assigned. */
export class ExternalVariable extends NamedVariable {
    public static readonly symbol = Symbol(`syntax.ExternalVariable.symbol`)

    public get symbol() : typeof ExternalVariable.symbol {
        return ExternalVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            other.symbol === ExternalVariable.symbol && other.name === this.name ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public sanity_check() {
        // External variables allowed only for file and not for a program.
        if (this.frame.symbol !== File.symbol) throw new Error // @todo
    }
    public toString() {
        return `[external] ${this.name}`
    }
}

/** Variable used to store result of an assignment or parameter. */
export class LocalVariable extends NamedVariable {
    public static readonly symbol = Symbol(`syntax.LocalVariable.symbol`)

    public get symbol() : typeof LocalVariable.symbol {
        return LocalVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            other.symbol === LocalVariable.symbol && other.name === this.name ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public toString() {
        return `[local] ${this.name}`
    }
}

/** Variable used to store result of an assignment or parameter. */
export class ParameterVariable extends NamedVariable {
    public static readonly symbol = Symbol(`syntax.ParameterVariable.symbol`)

    public get symbol() : typeof ParameterVariable.symbol {
        return ParameterVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            other.symbol === ParameterVariable.symbol && other.name === this.name ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public toString() {
        return `[param] ${this.name}`
    }
}

/** Variable used to store other variable from parent scope. */
export class ClosureVariable extends Variable {
    public static readonly symbol = Symbol(`syntax.ClosureVariable.symbol`)

    public readonly source : FrameVariableUnion

    public constructor({ source, frame } : { source : FrameVariableUnion, frame : FrameUnion }) {
        super({ frame })

        this.source = source
    }

    public get symbol() : typeof ClosureVariable.symbol {
        return ClosureVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return (
            other === this ||
            this.source.is_equal(other) ||
            other.symbol === ClosureVariable.symbol && this.is_equal(other.source)
        )
    }
    public sanity_check() {
        // Closure variables are impossible for files.
        if (this.frame.symbol === File.symbol) throw new Error // @todo
    }
    public toString() {
        return `[closure] ${this.source}`
    }
}

/** Represents program input. */
export class InputVariable extends Variable {
    public static readonly symbol = Symbol(`syntax.InputVariable.symbol`)

    public constructor({ frame } : { frame : FrameUnion }) {
        super({ frame })
    }

    public get symbol() : typeof InputVariable.symbol {
        return InputVariable.symbol
    }

    public is_equal(other : VariableUnion) : boolean {
        return other === this
    }
    public toString() : string {
        return `[input]`
    }
}

export type FrameVariableUnion = LiteralVariable | UnnamedVariable | ExternalVariable | LocalVariable | ParameterVariable | ClosureVariable
export type VariableUnion      = FrameVariableUnion | InputVariable

class FrameVariables {
    private readonly _array : FrameVariableUnion[] = []

    public readonly frame : FrameUnion

    public constructor({ frame } : { frame : FrameUnion }) {
        this.frame = frame
    }

    public get array() : readonly FrameVariableUnion[] {
        return this._array
    }

    private assert_not_existed(name : string) {
        if (this.find_by_name(name)) throw new Error(`Variable with name ${name} already exists.`)
    }
    private add<T extends FrameVariableUnion>(variable : T) {
        this._array.push(variable)

        return variable
    }

    public find_by_name(name : string) {
        const match = (v : FrameVariableUnion) : boolean =>
            (   v.symbol === ExternalVariable.symbol ||
                v.symbol === LocalVariable.symbol ||
                v.symbol === ParameterVariable.symbol
            ) ? v.name === name :
            v.symbol === ClosureVariable.symbol ? match(v.source) :
            false

        return this._array.find(match) || null
    }
    public get_by_name(name : string) {
        const existed = this.find_by_name(name)

        if (!existed) throw new Error(`Variable with name ${name} doesn't exist.`)

        return existed
    }
    public add_local(name : string) {
        this.assert_not_existed(name)

        const { frame } = this

        return this.add(new LocalVariable({ name, frame }))
    }
    public add_parameter(name : string) {
        this.assert_not_existed(name)

        const { frame } = this

        return this.add(new ParameterVariable({ name, frame }))
    }
    public add_external(name : string) {
        this.assert_not_existed(name)

        const { frame } = this

        return this.add(new ExternalVariable({ name, frame }))
    }
    public get_or_add_external(name : string) {
        const existed = this.find_by_name(name)

        if (existed) return existed

        return this.add_external(name)
    }
    public add_unnamed() {
        const { frame } = this

        return this.add(new UnnamedVariable({ frame }))
    }
    public get_or_add_literal(literal : syntax.LiteralUnion) : FrameVariableUnion {
        const match = (v : FrameVariableUnion) : boolean =>
            v.symbol === LiteralVariable.symbol ? v.literal.is_equal(literal) :
            v.symbol === ClosureVariable.symbol ? match(v.source) :
            false

        const existed = this._array.find(match)

        if (existed) return existed

        const { frame } = this

        if (frame.symbol === File.symbol) return this.add(new LiteralVariable({ literal, frame }))

        const source = frame.parent.variables.get_or_add_literal(literal)

        return this.add(new ClosureVariable({ source, frame }))
    }
    public add_closure(source : FrameVariableUnion) {
        const { frame } = this

        if (frame.symbol === File.symbol) throw new Error // @todo
        if (source.frame !== frame.parent) throw new Error // @todo
        if (this._array.some(x => x.symbol === ClosureVariable.symbol && x.source === source)) throw new Error // @todo

        return this.add(new ClosureVariable({ source, frame }))
    }
    public get_or_add_closure(source : FrameVariableUnion) {
        const { frame } = this

        if (frame.symbol === File.symbol) throw new Error // @todo
        if (source.frame !== frame.parent) throw new Error // @todo

        const existed = this._array.find(x => x.symbol === ClosureVariable.symbol && x.source === source)

        if (existed) return existed

        return this.add(new ClosureVariable({ source, frame }))
    }

    public toString() {
        return this._array.join(`\n`)
    }
}

export class Analyzer {
    public analyze(source : syntax.File) {
        return process_file(source)
    }
}

class Name {
    public readonly text       : string
    public          used       = false
    public          assigned = false
    public          parameter  = false

    public constructor({ text } : { text : string }) {
        this.text = text
    }
}

class Names {
    private _map = new Map<string, Name>()

    private get_text(source : NameSource) {
        if (source.symbol === syntax.NoneExpression.symbol) return `nothing`
        else if (source.symbol === syntax.NameExpression.symbol) return source.name.text
        else if (source.symbol === syntax.NameDestructuring.symbol) return source.name.text
        else assert_never(source, new Error) // @todo
    }
    private find_or_add(text : string) {
        const existed = this._map.get(text)

        if (existed) return existed

        const added = new Name({ text })

        this._map.set(text, added)

        return added
    }

    public add_usage(source : NameSource) {
        const text = this.get_text(source)
        const variable = this.find_or_add(text)

        variable.used = true

        return variable
    }
    public add_assignment(source : NameSource) {
        const text = this.get_text(source)
        const variable = this.find_or_add(text)

        variable.assigned = true

        return variable
    }
    public add_parameter(source : NameSource) {
        const text = this.get_text(source)
        const variable = this.find_or_add(text)

        variable.parameter = true

        return variable
    }
    public for_each(callback : (name : Name) => void) {
        for (const name of this._map.values()) callback(name)
    }
}

type NameSource = syntax.NoneExpression | syntax.NameExpression | syntax.NameDestructuring

function process_file(source : syntax.File) {
    const names = new Names

    scan_statements(source.statements, names)

    const file = new File

    names.for_each(name => {
        if (name.parameter) throw new Error // @todo
        else if (name.assigned) file.variables.add_local(name.text)
        else if (name.used) file.variables.add_external(name.text)
        else throw new Error // @todo
    })

    process_statements(source.statements, file)

    return file
}

function scan_statements(stats : syntax.StatementUnion[], names : Names) {
    for (const stat of stats) scan_statement(stat, names)
}

function scan_statement(stat : syntax.StatementUnion, names : Names) {
    if (stat.symbol === syntax.ExpressionStatement.symbol) {
        scan_expression(stat.expression, names)
    }
    else if (stat.symbol === syntax.BlockStatement.symbol) {
        scan_statements(stat.statements, names)
    }
    else if (stat.symbol === syntax.IfStatement.symbol) {
        scan_expression(stat.condition, names)
        scan_statement(stat.then, names)
    }
    else if (stat.symbol === syntax.ReturnStatement.symbol) {
        scan_expression(stat.expression, names)
    }
    else assert_never(stat, new Error) // @todo
}

function scan_expression(exp : syntax.ExpressionUnion, names : Names) {
    if (exp.symbol === syntax.NoneExpression.symbol) {
        names.add_usage(exp)
    }
    else if (exp.symbol === syntax.NameExpression.symbol) {
        names.add_usage(exp)
    }
    else if (exp.symbol === syntax.LiteralExpression.symbol) {
        // do nothing
    }
    else if (exp.symbol === syntax.AssignmentExpression.symbol) {
        scan_destructuring(exp.output, names, `assignment`)
        scan_expression(exp.input, names)
    }
    else if (exp.symbol === syntax.ListExpression.symbol) {
        exp.expressions.forEach(exp => scan_expression(exp, names))
    }
    else if (exp.symbol === syntax.CallExpression.symbol) {
        scan_expression(exp.target, names)
        scan_expression(exp.input, names)
    }
    else if (exp.symbol === syntax.ProgramExpression.symbol) {
        // do nothing
    }
    else assert_never(exp, new Error) // @todo
}

function scan_destructuring(des : syntax.DestructuringUnion, names : Names, usage : `assignment` | `parameters`) {
    if (des.symbol === syntax.EmptyDestructuring.symbol) {
        // do nothing
    }
    else if (des.symbol === syntax.NameDestructuring.symbol) {
        if (usage === `assignment`) names.add_assignment(des)
        else if (usage === `parameters`) names.add_parameter(des)
        else assert_never(usage, new Error) // @todo
    }
    else if (des.symbol === syntax.ListDestructuring.symbol) {
        des.expressions.forEach(exp => scan_destructuring(exp, names, usage))
    }
    else assert_never(des, new Error) // @todo
}

function process_statements(stats : syntax.StatementUnion[], exe : ExecutableUnion) {
    for (const stat of stats) process_statement(stat, exe)
}

function process_statement(stat : syntax.StatementUnion, exe : ExecutableUnion) {
    if (stat.symbol === syntax.ExpressionStatement.symbol) {
        process_expression(stat.expression, exe)
    }
    else if (stat.symbol === syntax.BlockStatement.symbol) {
        const block = exe.statements.add_block()

        process_statements(stat.statements, block)
    }
    else if (stat.symbol === syntax.IfStatement.symbol) {
        const condition = process_expression(stat.condition, exe)
        const branching = exe.statements.add_if(condition)

        process_statement(stat.then, branching.then)
    }
    else if (stat.symbol === syntax.ReturnStatement.symbol) {
        const output = process_expression(stat.expression, exe)

        exe.statements.add_return(output)
    }
    else assert_never(stat, new Error) // @todo
}

function process_expression(exp : syntax.ExpressionUnion, exe : ExecutableUnion) : VariableUnion {
    if (exp.symbol === syntax.NoneExpression.symbol) {
        return exe.frame.variables.get_by_name(`nothing`)
    }
    else if (exp.symbol === syntax.NameExpression.symbol) {
        return exe.frame.variables.get_by_name(exp.name.text)
    }
    else if (exp.symbol === syntax.LiteralExpression.symbol) {
        return exe.frame.variables.get_or_add_literal(exp.literal)
    }
    else if (exp.symbol === syntax.AssignmentExpression.symbol) {
        const input = process_expression(exp.input, exe)

        process_destructuring(exp.output, input, exe)

        return input
    }
    else if (exp.symbol === syntax.ListExpression.symbol) {
        const inputs = exp.expressions.map(exp => process_expression(exp, exe))

        return exe.statements.add_pack(inputs).output
    }
    else if (exp.symbol === syntax.CallExpression.symbol) {
        const target = process_expression(exp.target, exe)
        const input = process_expression(exp.input, exe)
        const call = exe.statements.add_call(target, input)

        return call.output
    }
    else if (exp.symbol === syntax.ProgramExpression.symbol) {
        return process_program(exp, exe).variable
    }
    else assert_never(exp, new Error) // @todo
}

function process_destructuring(des : syntax.DestructuringUnion, input : VariableUnion, exe : ExecutableUnion) {
    if (des.symbol === syntax.EmptyDestructuring.symbol) {
        // do nothing
    }
    else if (des.symbol === syntax.NameDestructuring.symbol) {
        const output = exe.frame.variables.get_by_name(des.name.text)

        exe.statements.add_assignment(output, input)
    }
    else if (des.symbol === syntax.ListDestructuring.symbol) {
        throw new Error // @todo
    }
    else assert_never(des, new Error) // @todo
}

function process_program(exp : syntax.ProgramExpression, exe : ExecutableUnion) {
    const names = new Names

    scan_destructuring(exp.program.input, names, `parameters`)
    scan_statement(exp.program.body, names)

    // add externals
    names.for_each(name => {
        if (name.assigned || name.parameter || !name.used) return

        exe.file.variables.get_or_add_external(name.text)
    })

    const prog = new Program({ parent : exe.frame })

    names.for_each(name => {
        const source = exe.frame.variables.find_by_name(name.text)

        if (!source) return

        prog.variables.get_or_add_closure(source)
    })

    function process_parameter(param : syntax.DestructuringUnion, input : VariableUnion) {
        if (param.symbol === syntax.EmptyDestructuring.symbol) {
            // do nothing
        }
        else if (param.symbol === syntax.NameDestructuring.symbol) {
            const output = prog.variables.add_parameter(param.name.text)

            prog.statements.add_assignment(output, input)
        }
        else if (param.symbol === syntax.ListDestructuring.symbol) {
            const outputs = param.expressions.map(() => prog.variables.add_unnamed())

            prog.statements.add_unpack(input, outputs)
            param.expressions.forEach((param, i) => process_parameter(param, outputs[i]))
        }
        else assert_never(param, new Error) // @todo
    }

    const input = new InputVariable({ frame : prog })

    process_parameter(exp.program.input, input)
    process_statement(exp.program.body, prog)

    return exe.statements.add_program(prog)
}
