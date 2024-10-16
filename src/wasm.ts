import * as syntax from './syntax'
import * as semantic from './semantic'
import { tab, assert_never } from './utilities'

class VariablesMapper {
    private lookup = new Map<semantic.VariableUnion, string>()

    public get(variable : semantic.VariableUnion) {
        let name = this.lookup.get(variable)

        if (name != null) return name

        for (const [ other, name ] of this.lookup) {
            if (!variable.is_equal(other)) continue

            this.lookup.set(variable, name)

            return name
        }

        name = `$v${this.lookup.size}`

        this.lookup.set(variable, name)

        return name
    }
}

class ProgramsMapper {
    private lookup = new Map<semantic.Program, string>()

    public get(program : semantic.Program) {
        let name = this.lookup.get(program)

        if (name != null) return name

        name = `$program${this.lookup.size}`

        this.lookup.set(program, name)

        return name
    }
}

export class Translation {
    public readonly main  : string
    public readonly table : string

    public constructor({ main, table } : { main : string, table : string }) {
        this.main  = main
        this.table = table
    }
}

export class Translator {
    public translate(file : semantic.File) {
        const variables_naming = new VariablesMapper
        const programs_naming = new ProgramsMapper

        const stringify_variables = (variables : readonly semantic.VariableUnion[]) => {
            return (
                variables
                .map(x => `(local ${variables_naming.get(x)} i32)`)
                .join(`\n`)
            )
        }

        const initialize_variables = (variables : readonly semantic.FrameVariableUnion[], exe : semantic.ExecutableUnion) => {
            const initialize_variable = (variable : semantic.FrameVariableUnion) : string => {
                const name = variables_naming.get(variable)

                if (variable.symbol === semantic.LocalVariable.symbol) {
                    return (
                        `call $global.nothing\n` +
                        `call $Variable.constructor\n` +
                        `local.set ${name}`
                    )
                }
                else if (variable.symbol === semantic.ClosureVariable.symbol) {
                    if (exe.symbol !== semantic.Program.symbol) throw new Error // @todo

                    const index = exe.closure.indexOf(variable)

                    if (index < 0) throw new Error // @todo

                    return (
                        `local.get $program\n` +
                        `i32.const ${index}\n` +
                        `call $Program.instance.closure.get_at\n` +
                        // `call $Variable.constructor\n` +
                        `local.set ${name}`
                    )
                    // throw new Error // @todo
                }
                else if (variable.symbol === semantic.LiteralVariable.symbol) {
                    const { literal } = variable

                    if (literal.symbol === syntax.IntegerLiteral.symbol) {
                        return (
                            `i32.const ${literal.text}\n` +
                            `call $Int32.instance.constructor\n` +
                            `call $Variable.constructor\n` +
                            `local.set ${name}`
                        )
                    }
                    else assert_never(literal.symbol, new Error) // @todo
                }
                else if (variable.symbol === semantic.UnnamedVariable.symbol) {
                    return (
                        `call $global.nothing\n` +
                        `call $Variable.constructor\n` +
                        `local.set ${name}`
                    )
                }
                else if (variable.symbol === semantic.ExternalVariable.symbol) {
                    const text = variable.name

                    switch (text) {
                        case `nothing`: return (
                            `call $global.nothing\n` +
                            `call $Variable.constructor\n` +
                            `local.set ${name}`
                        )
                        case `print`: return (
                            `call $global.print\n` +
                            `call $Variable.constructor\n` +
                            `local.set ${name}`
                        )
                    }

                    throw new Error // @todo
                }
                else if (variable.symbol === semantic.ParameterVariable.symbol) {
                    // return (
                    //     `call $global.nothing\n` +
                    //     `call $Variable.constructor\n` +
                    //     `local.set ${name}`
                    // )
                    throw new Error // @todo
                }
                else assert_never(variable, new Error) // @todo
            }

            return variables
                .map(initialize_variable)
                .join(`\n\n`)
        }

        const stringify_statements = (statements : readonly semantic.StatementUnion[]) => {
            const stringify_statement = (statement : semantic.StatementUnion) : string => {
                if (statement.symbol === semantic.CallStatement.symbol) {
                    const target = variables_naming.get(statement.target)
                    const input  = variables_naming.get(statement.input)
                    const output = variables_naming.get(statement.output)

                    return (
                        `local.get ${output}\n` +
                        `    local.get ${target}\n` +
                        `    call $Variable.target\n` +
                        `    local.get ${input}\n` +
                        `    call $Variable.target\n` +
                        `    call $call\n` +
                        `call $Variable.target.set`
                    )
                }
                else if (statement.symbol === semantic.IfStatement.symbol) {
                    throw new Error // @todo
                }
                else if (statement.symbol === semantic.PackStatement.symbol) {
                    throw new Error // @todo
                }
                else if (statement.symbol === semantic.BlockStatement.symbol) {
                    return stringify_statements(statement.statements.array)
                    // throw new Error // @todo
                }
                else if (statement.symbol === semantic.ReturnStatement.symbol) {
                    const result = variables_naming.get(statement.variable)

                    return (
                        `local.get ${result}\n` +
                        `call $Variable.target\n` +
                        `return`
                    )
                }
                else if (statement.symbol === semantic.ProgramStatement.symbol) {
                    const variable = variables_naming.get(statement.variable)
                    const { program, program : { closure } } = statement
                    const index = file.programs.indexOf(program)

                    if (index < 0) throw new Error // @todo

                    return (
                        `local.get ${variable}\n` +
                        `    i32.const ${closure.length}\n` +
                        `    i32.const ${index}\n` +
                        `    call $Program.instance.constructor\n` +
                        `call $Variable.target.set\n` +
                        closure
                        .map(({ source }, i) => (
                            `local.get ${variable}\n` +
                            `call $Variable.target\n` +
                            `i32.const ${i}\n` +
                            `local.get ${variables_naming.get(source)}\n` +
                            `call $Program.instance.closure.set_at\n`
                        ))
                        .map(x => tab(x))
                        .join(`\n`)
                    )
                }
                else if (statement.symbol === semantic.AssignmentStatement.symbol) {
                    const input  = variables_naming.get(statement.input)
                    const output = variables_naming.get(statement.output)

                    return (
                        `local.get ${input}\n` +
                        `local.set ${output}`
                    )
                }
                else if (statement.symbol === semantic.UnpackStatement.symbol) {
//                     const input  = variables_naming.get(statement.input)
//                     const output = variables_naming.get(statement.output)
//
//                     return (
//                         `local.get ${input}\n` +
//                         `local.set ${output}`
//                     )
                    throw new Error // @todo
                }
                else assert_never(statement, new Error) // @todo
            }

            return statements
                .map(stringify_statement)
                .join(`\n\n`)
        }

        const stringify_programs = (programs : semantic.Program[]) => {
            const stringify_program = (program : semantic.Program) => {
                return (
                    `(func ${programs_naming.get(program)} (param $program i32) (param $input i32) (result i32)\n` +
                    tab(stringify_variables(program.variables.array)) + `\n` +
                    `    \n` +
                    tab(initialize_variables(program.variables.array, program)) + `\n` +
                    `    \n` +
                    tab(stringify_statements(program.statements.array)) + `\n` +
                        `    \n` +
                    `    ;; final return\n` +
                    `    call $global.nothing\n` +
                    `    return\n` +
                    `)`
                )
            }

            return programs
                .map(stringify_program)
                .join(`\n\n`)
        }

        const table = (
            `(elem (i32.const 100)\n` +
            tab(
                file.programs
                .map(x =>
                    `${programs_naming.get(x)}`
                )
                .map(x => tab(x))
                .join(`\n`),
                `    `.repeat(3)
            )+
            `)`
        )

        const main = (
            stringify_programs(file.programs) +
            `\n` +
            `(func $main (result i32)\n` +
            tab(stringify_variables(file.variables.array)) + `\n` +
            `    \n` +
            `    call $init\n` +
            `    \n` +
            tab(initialize_variables(file.variables.array, file)) + `\n` +
            `    \n` +
            tab(stringify_statements(file.statements.array)) + `\n` +
            `    \n` +
            `    ;; final return\n` +
            `    call $global.nothing\n` +
            `    return\n` +
            `)`
        )

        return new Translation({ main, table })
    }
}
