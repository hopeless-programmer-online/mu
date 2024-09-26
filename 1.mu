fact = program(x) {
    if le(x, 1): return 1

    return mul( x, fact( sub(x, 1) ) )
}
