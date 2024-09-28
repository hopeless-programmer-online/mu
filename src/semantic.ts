import * as syntax from './syntax'

export type File = {
    programs   : Program[]
    variables  : number
    statements : Statement[]
}

export type Program = {
    closure    : number[]
    inputs     : number
    variables  : number
    statements : Statement[]
}

export type Declaration = {
    type     : `declaration`
    variable : number
    program  : number
}

export type Call = {
    type    : `call`
    target  : number
    inputs  : number[]
    outputs : number[]
}

export type Return = {
    type   : `return`
    inputs : number[]
}

export type If = {
    type       : `if`
    condition  : number
    statements : Statement[]
}

export type Statement = Declaration | Call | Return | If

export class Analyzer {
//     public analyze_file(root : syntax.File) {
//         const processor = new FileProcessor
//
//         processor.process_statements(root.statements)
//     }
}

// class VariableContext

// class FileProcessor {
//     private variables : string[] = []
//
//     // public readonly file : File = { // @todo: turn into getter
//     //     programs   : [],
//     //     variables  : 0,
//     //     statements : [],
//     // }
//
//     public process_statements(statements : syntax.Statement[]) {
//         statements.forEach(this.process_statement)
//     }
//
//     private process_statement = (statement : syntax.Statement) => {
//         switch (statement.type) {
//             // case `assignment`: return this.process_assignment(statement)
//             // case ``
//             // case `call`: return this.process_call(statement)
//             default: throw new Error(`Unexpected statement: ${statement}`)
//         }
//     }
//
//     private add_variable = ({ text } : syntax.Name) => {
//         if (!this.variables.includes(text)) this.variables.push(text)
//     }
//
//     private process_assignment(assignment : syntax.Assignment) {
//         this.process_target(assignment.output)
//         this.process_expression(assignment.input)
//     }
//
//     private process_target(target : syntax.Target) {
//         switch (target.type) {
//             case `empty`: return
//             case `name`: return this.add_variable(target)
//             case `target_list`: return target.targets.forEach(this.process_target)
//         }
//
//         // assignment.outputs.forEach(this.add_variable)
//     }
//
//     // private process_call(call : syntax.Call) {
//     //     this.process_expression(call.target)
//     //     // @todo
//     // }
//
//     private process_expression(expression : syntax.Expression) {
//     //     switch (expression.type) {
//     //         case `assignment`: return this.process_assignment(expression)
//     //         // case `call`: return this.process_call(expression)
//     //         // case `name`: return this.add_variable(expression)
//     //         // case `program`
//     //         default: throw new Error(`Unexpected expression: ${expression}`)
//     //     }
//     }
// }
