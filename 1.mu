fact = program(x) {
    if __le__(x, 1) then return 1

    return __mul__( x, fact( __sub__(x, 1) ) )
}

print( fact(5) )
