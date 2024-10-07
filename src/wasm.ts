import * as syntax from './syntax'
import * as semantic from './semantic'
import { tab, assert_never } from './utilities'

class VariablesMapper {
    private lookup = new Map<semantic.VariableUnion, string>()

    public get(variable : semantic.VariableUnion) {
        let name = this.lookup.get(variable)

        if (name != null) return name

        const match = (target : semantic.VariableUnion, other : semantic.VariableUnion) : boolean => {
            if (other === target) return true
            if (target.symbol === semantic.UndeclaredVariable.symbol && match(target.value, other)) return true
            if (other.symbol === semantic.UndeclaredVariable.symbol) return match(target, other.value)

            return false
        }

        for (const [ other, name ] of this.lookup) {
            if (!match(variable, other)) continue

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

export class Translator {
    public translate(file : semantic.File) {
        const variables_naming = new VariablesMapper
        const programs_naming = new ProgramsMapper

        const stringify_variables = (variables : semantic.VariableUnion[]) => {
            return (
                variables
                .map(x => `(local ${variables_naming.get(x)} i32)`)
                .join(`\n`)
            )
        }

        const initialize_variables = (variables : semantic.VariableUnion[], scope : semantic.ScopeUnion) => {
            const initialize_variable = (variable : semantic.VariableUnion) : string => {
                const name = variables_naming.get(variable)

                if (variable.symbol === semantic.NamedVariable.symbol) {
                    return (
                        `call $global.nothing\n` +
                        `local.set ${name}`
                    )
                }
                else if (variable.symbol === semantic.ClosureVariable.symbol) {
                    if (scope.symbol !== semantic.Program.symbol) throw new Error // @todo

                    const find = (other : semantic.VariableUnion) : boolean => {
                        if (other === variable) return true
                        if (other.symbol === semantic.UndeclaredVariable.symbol) return find(other.value)

                        return false
                    }

                    const index = scope.closure.findIndex(find)

                    if (index < 0) {
                        console.log(variable)
                        console.log(scope.closure)
                        console.log(scope.variables)

                        throw new Error // @todo
                    }

                    return (
                        `local.get $program\n` +
                        `i32.const ${index}\n` +
                        `call $Program.instance.closure.get_at\n` +
                        `local.set ${name}`
                    )
                }
                else if (variable.symbol === semantic.LiteralVariable.symbol) {
                    const { literal } = variable

                    if (literal.symbol === syntax.IntegerLiteral.symbol) {
                        return (
                            `i32.const ${literal.text}\n` +
                            `call $Int32.instance.constructor\n` +
                            `local.set ${name}`
                        )
                    }
                    else assert_never(literal.symbol, new Error) // @todo
                }
                else if (variable.symbol === semantic.UnnamedVariable.symbol) {
                    return (
                        `call $global.nothing\n` +
                        `local.set ${name}`
                    )
                }
                else if (variable.symbol === semantic.ExternalVariable.symbol) {
                    const { text } = variable.name

                    switch (text) {
                        case `nothing`: return (
                            `call $global.nothing\n` +
                            `local.set ${name}`
                        )
                        case `print`: return (
                            `call $global.print\n` +
                            `local.set ${name}`
                        )
                    }

                    throw new Error // @todo
                }
                else if (variable.symbol === semantic.UndeclaredVariable.symbol) {
                    return initialize_variable(variable.value)
                }
                else assert_never(variable, new Error) // @todo
            }

            return variables
                .map(initialize_variable)
                .join(`\n\n`)
        }

        const stringify_statements = (statements : semantic.StatementUnion[]) => {
            const stringify_statement = (statement : semantic.StatementUnion) : string => {
                if (statement.symbol === semantic.CallStatement.symbol) {
                    const target = variables_naming.get(statement.target)
                    const input  = variables_naming.get(statement.input)
                    const output = variables_naming.get(statement.output)

                    return (
                        `local.get ${target}\n` +
                        `local.get ${input}\n` +
                        `call $call\n` +
                        `local.set ${output}`
                    )
                }
                else if (statement.symbol === semantic.IfStatement.symbol) {
                    throw new Error // @todo
                }
                else if (statement.symbol === semantic.ListStatement.symbol) {
                    throw new Error // @todo
                }
                else if (statement.symbol === semantic.BlockStatement.symbol) {
                    return stringify_statements(statement.statements)
                    // throw new Error // @todo
                }
                else if (statement.symbol === semantic.ReturnStatement.symbol) {
                    const result = variables_naming.get(statement.variable)

                    return (
                        `local.get ${result}\n` +
                        `return`
                    )
                }
                else if (statement.symbol === semantic.ProgramStatement.symbol) {
                    const { program } = statement
                    const variable = variables_naming.get(statement.variable)

                    // program.closure.map(x => {
                    //     x
                    // })

                    return (
                        `i32.const ${program.closure.length}\n` +
                        `call $Program.instance.constructor\n` +
                        `local.set ${variable}`
                    )

                    // throw new Error // @todo
                }
                else if (statement.symbol === semantic.AssignmentStatement.symbol) {
                    const input  = variables_naming.get(statement.input)
                    const output = variables_naming.get(statement.output)

                    return (
                        `local.get ${input}\n` +
                        `local.set ${output}`
                    )
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
                    tab(stringify_variables(program.variables)) + `\n` +
                    `    \n` +
                    tab(initialize_variables(program.variables, program)) + `\n` +
                    `    \n` +
                    tab(stringify_statements(program.statements)) + `\n` +
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

        const file_text = (
            stringify_programs(file.programs) +
            `\n` +
            `(func $main (result i32)\n` +
            tab(stringify_variables(file.variables)) + `\n` +
            `    \n` +
            `    call $init\n` +
            `    \n` +
            tab(initialize_variables(file.variables, file)) + `\n` +
            `    \n` +
            tab(stringify_statements(file.statements)) + `\n` +
            `    \n` +
            `    ;; final return\n` +
            `    call $global.nothing\n` +
            `    return\n` +
            `)`
        )

        return file_text
    }
}
