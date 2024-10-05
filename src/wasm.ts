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

export class Translator {
    public translate(file : semantic.File) {
        const naming = new VariablesMapper

        const stringify_variables = (variables : semantic.VariableUnion[]) => {
            return (
                variables
                .map(x => `(local ${naming.get(x)} i32)`)
                .join(`\n`)
            )
        }

        const initialize_variable = (variable : semantic.VariableUnion) : string => {
            const name = naming.get(variable)

            if (variable.symbol === semantic.NamedVariable.symbol) {
                throw new Error // @todo
            }
            else if (variable.symbol === semantic.ClosureVariable.symbol) {
                throw new Error // @todo
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

                if (text === `print`) {
                    return (
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

        const initialize_variables = (variables : semantic.VariableUnion[]) => {
            return variables
                .map(initialize_variable)
                .join(`\n\n`)
        }

        const stringify_statement = (statement : semantic.StatementUnion) => {
            if (statement.symbol === semantic.CallStatement.symbol) {
                const target = naming.get(statement.target)
                const input  = naming.get(statement.input)
                const output = naming.get(statement.output)

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
                throw new Error // @todo
            }
            else if (statement.symbol === semantic.ReturnStatement.symbol) {
                const result = naming.get(statement.variable)

                return (
                    `local.get ${result}\n` +
                    `return`
                )
            }
            else if (statement.symbol === semantic.ProgramStatement.symbol) {
                throw new Error // @todo
            }
            else if (statement.symbol === semantic.AssignmentStatement.symbol) {
                const input  = naming.get(statement.input)
                const output = naming.get(statement.output)

                return (
                    `local.get ${input}\n` +
                    `local.set ${output}`
                )
            }
            else assert_never(statement, new Error) // @todo
        }

        const stringify_statements = (statements : semantic.StatementUnion[]) => {
            return statements
                .map(stringify_statement)
                .join(`\n\n`)
        }

        const file_text = (
            `(func $main (result i32)\n` +
            tab(stringify_variables(file.variables)) + `\n` +
            `    \n` +
            `    call $init\n` +
            `    \n` +
            tab(initialize_variables(file.variables)) + `\n` +
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
