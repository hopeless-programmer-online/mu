export function tab(text : string, indent = `    `) {
    return text.replace(/^/, indent).replace(/\n/g, `\n${indent}`)
}

export function assert_never(never : never, error : Error) : never {
    throw error
}
