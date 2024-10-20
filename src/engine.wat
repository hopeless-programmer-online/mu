(module
    (import "print" "int32" (func $print.int32 (param i32)))
    (import "print" "ascii" (func $print.ascii (param i32) (param i32)))

    (memory $memory 1)
    ;; { memory mapping
        ;; text
        (data (i32.const 0)  "\n")      (; 0 + 1 = 1 ;)      (func $write.newline (call $print.ascii (i32.const 0) (i32.const 1)))
        (data (i32.const 1)  "ERROR")   (; 1 + 5 = 6 ;)      (func $write.ERROR   (call $print.ascii (i32.const 1) (i32.const 5)))
        (data (i32.const 6)  "unknown") (; 6 + 7 = 13 ;)     (func $write.unknown (call $print.ascii (i32.const 6) (i32.const 7)))
        (data (i32.const 13) "nothing") (; 13 + 7 = 20 ;)    (func $write.nothing (call $print.ascii (i32.const 13) (i32.const 7)))
        (data (i32.const 20) "print")   (; 20 + 5 = 25 ;)    (func $write.print   (call $print.ascii (i32.const 20) (i32.const 5)))
        (data (i32.const 25) "pack")    (; 25 + 4 = 29 ;)    (func $write.pack    (call $print.ascii (i32.const 25) (i32.const 4)))
        (data (i32.const 29) "__le__")  (; 29 + 6 = 35 ;)    (func $write.__le__  (call $print.ascii (i32.const 29) (i32.const 6)))
        (data (i32.const 35) "__mul__") (; 35 + 7 = 42 ;)    (func $write.__mul__ (call $print.ascii (i32.const 35) (i32.const 7)))
        (data (i32.const 42) "__sub__") (; 42 + 7 = 49 ;)    (func $write.__sub__ (call $print.ascii (i32.const 42) (i32.const 7)))
        ;; globals
        (func $global.nothing.address (result i32) i32.const 768 return) (func $global.nothing (result i32) call $global.nothing.address i32.load return)
        (func $global.print.address   (result i32) i32.const 772 return) (func $global.print   (result i32) call $global.print.address i32.load return)
        (func $global.__le__.address  (result i32) i32.const 776 return) (func $global.__le__  (result i32) call $global.__le__.address i32.load return)
        (func $global.__mul__.address (result i32) i32.const 780 return) (func $global.__mul__ (result i32) call $global.__mul__.address i32.load return)
        (func $global.__sub__.address (result i32) i32.const 784 return) (func $global.__sub__ (result i32) call $global.__sub__.address i32.load return)
        ;; heap
        (func $heap.begin (result i32) i32.const 1024)
        (func $heap.end   (result i32) i32.const 65524) ;; 1×65K - 12
    ;; }

    ;; { heap
        (func $heap.init
            call $heap.begin
            call $heap.begin
            call $mem.node.prev.set

            call $heap.begin
            call $heap.end
            call $mem.node.next.set

            call $heap.begin
            i32.const 0
            call $mem.node.size.set

            call $heap.end
            call $heap.begin
            call $mem.node.prev.set

            call $heap.end
            call $heap.end
            call $mem.node.next.set

            call $heap.end
            i32.const 0
            call $mem.node.size.set
        )
        (func $heap.available (result i32)
            (local $node i32)
            (local $available i32)

            i32.const 0
            local.set $available

            call $heap.begin
            local.set $node

            (loop $continue (block $break
                local.get $node
                call $heap.end
                i32.eq
                br_if $break

                local.get $node
                call $mem.node.capacity
                local.get $available
                i32.add
                local.set $available

                local.get $node
                call $mem.node.next
                local.set $node

                br $continue
            ))

            local.get $available
            return
        )
        (func $heap.max (result i32)
            (local $node i32)
            (local $capacity i32)
            (local $max i32)

            i32.const 0
            local.set $max

            call $heap.begin
            local.set $node

            (loop $continue (block $break
                local.get $node
                call $heap.end
                i32.eq
                br_if $break

                (block $check_max
                    local.get $node
                    call $mem.node.capacity
                    local.tee $capacity
                    local.get $max
                    i32.le_u
                    br_if $check_max

                    local.get $capacity
                    local.set $max
                )

                local.get $node
                call $mem.node.next
                local.set $node

                br $continue
            ))

            local.get $max
            return
        )
        (func $sizeof.node (result i32)
            i32.const 12
            return
        )
        (func $mem.node.prev.offset (result i32)
            i32.const 0
        )
        (func $mem.node.prev (param $node i32) (result i32)
            local.get $node
            call $mem.node.prev.offset
            i32.add
            i32.load
            return
        )
        (func $mem.node.prev.set (param $node i32) (param $prev i32)
            local.get $node
            call $mem.node.prev.offset
            i32.add
            local.get $prev
            i32.store
        )
        (func $mem.node.next.offset (result i32)
            i32.const 4
        )
        (func $mem.node.next (param $node i32) (result i32)
            local.get $node
            call $mem.node.next.offset
            i32.add
            i32.load
            return
        )
        (func $mem.node.next.set (param $node i32) (param $next i32)
            local.get $node
            call $mem.node.next.offset
            i32.add
            local.get $next
            i32.store
        )
        (func $mem.node.size.offset (result i32)
            i32.const 8
        )
        (func $mem.node.size (param $node i32) (result i32)
            local.get $node
            call $mem.node.size.offset
            i32.add
            i32.load
            return
        )
        (func $mem.node.size.set (param $node i32) (param $size i32)
            local.get $node
            call $mem.node.size.offset
            i32.add
            local.get $size
            i32.store
        )
        (func $mem.node.capacity (param $node i32) (result i32)
            (local $capacity i32)
            ;; node.next - node - sizeof(node) * 2 - node.size
            local.get $node
            call $mem.node.next
            local.get $node
            i32.sub
                ;; sizeof(node) * 2
                call $sizeof.node
                i32.const 2
                i32.mul
            i32.sub
            local.get $node
            call $mem.node.size
            i32.sub
            local.tee $capacity
            ;; if capacity < 0 then return 0
            i32.const 0
            i32.lt_s
            (if (then
                i32.const 0
                return
            ))
            local.get $capacity
            return
        )
        (func $mem.node.split (param $node i32) (param $size i32) (result i32)
            (local $new i32)
            (local $next i32)
            ;; node + sizeof(node) + node.size
            local.get $node
            call $sizeof.node
            i32.add
            local.get $node
            call $mem.node.size
            i32.add
            local.set $new

            ;; new.prev = node
            local.get $new
            local.get $node
            call $mem.node.prev.set
            ;; new.next = next
            local.get $new
            local.get $node
            call $mem.node.next
            local.tee $next
            call $mem.node.next.set
            ;; next.prev = new
            local.get $next
            local.get $new
            call $mem.node.prev.set
            ;; new.size = size
            local.get $new
            local.get $size
            call $mem.node.size.set
            ;; node.next = new
            local.get $node
            local.get $new
            call $mem.node.next.set

            ;; return new
            local.get $new
            return
        )
        (func $mem.node.mem (param $node i32) (result i32)
            local.get $node
            call $sizeof.node
            i32.add
            return
        )
        (func $mem.node (param $mem i32) (result i32)
            local.get $mem
            call $sizeof.node
            i32.sub
            return
        )
        (func $mem.allocate (param $size i32) (result i32)
            (local $node i32)

            call $heap.begin
            local.set $node

            (loop $iterate_nodes (block $break_nodes
                ;; if node == heap.end then break
                local.get $node
                call $heap.end
                i32.eq
                br_if $break_nodes

                (block $try_split
                    ;; if size > node.capacity then break
                    local.get $size
                    local.get $node
                    call $mem.node.capacity
                    i32.gt_u
                    br_if $try_split

                    ;; return node.mem
                    local.get $node
                    local.get $size
                    call $mem.node.split
                    call $mem.node.mem
                    return
                )

                local.get $node
                call $mem.node.next
                local.set $node

                br $iterate_nodes
            ))

            ;; OOM
            i32.const 80
            i32.const 13
            call $print.ascii
            i32.const 0
            i32.const 1
            call $print.ascii

            ;; allocation size
            local.get $size
            call $print.int32
            i32.const 0
            i32.const 1
            call $print.ascii

            ;; allocation size
            call $heap.available
            call $print.int32
            i32.const 0
            i32.const 1
            call $print.ascii

            ;; allocation size
            call $heap.max
            call $print.int32
            i32.const 0
            i32.const 1
            call $print.ascii

            ;; @todo
            ;; call $heap.print

            i32.const 0
            return
        )
        (func $mem.free (param $mem i32)
            (local $node i32)
            local.get $mem
            call $mem.node
            local.set $node
            ;; node.next.prev = node.prev
            local.get $node
            call $mem.node.next
            local.get $node
            call $mem.node.prev
            call $mem.node.prev.set
            ;; node.prev.next = node.next
            local.get $node
            call $mem.node.prev
            local.get $node
            call $mem.node.next
            call $mem.node.next.set
        )
    ;; }

    ;; { types
        (func $type.Nothing          (result i32) i32.const 0 return)
        (func $type.Print            (result i32) i32.const 1 return)
        (func $type.Int32.instance   (result i32) i32.const 2 return)
        (func $type.Program.instance (result i32) i32.const 3 return)
        (func $type.Pack.instance    (result i32) i32.const 4 return)
        (func $type.__le__           (result i32) i32.const 5 return)
        (func $type.__mul__          (result i32) i32.const 6 return)
        (func $type.__sub__          (result i32) i32.const 7 return)
    ;; }

    (table 100 funcref)
    ;; { tables
        ;; { call
            (func $virtual.call.offset (result i32) i32.const 0)
            (elem (i32.const 0)
                $virtual.call.error    ;; Nothing
                $Print.call            ;; Print
                $Int32.instance.call   ;; Int32.instance
                $Program.instance.call ;; Program.instance
                $virtual.call.error    ;; Pack.instance
                $__le__.call           ;; __le__
                $__mul__.call          ;; __mul__
                $__sub__.call          ;; __sub__
            )
            (type $virtual.call (func (param $something i32) (param $input i32) (result i32)))
            (func $virtual.call (param $something i32) (param $input i32) (result i32)
                local.get $something
                local.get $input

                local.get $something
                call $something.type
                call $virtual.call.offset
                i32.add
                call_indirect (type $virtual.call)
                return
            )
            (func $virtual.call.error (param $something i32) (param $input i32) (result i32)
                call $write.ERROR
                call $write.newline

                call $global.nothing
                return
            )
        ;; }

        ;; { print
            (func $virtual.print.offset (result i32) i32.const 20)
            (elem (i32.const 20)
                $Nothing.print         ;; Nothing
                $Print.print           ;; Print
                $Int32.instance.print  ;; Int32.instance
                $virtual.print.unknown ;; Program.instance
                $Pack.instance.print   ;; Pack.instance
                $__le__.print          ;; __le__
                $__mul__.print         ;; __mul__
                $__sub__.print         ;; __sub__
            )
            (type $virtual.print (func (param $something i32)))
            (func $virtual.print (param $something i32)
                local.get $something

                local.get $something
                call $something.type
                call $virtual.print.offset
                i32.add
                call_indirect (type $virtual.print)
            )
            (func $virtual.print.unknown (param $something i32)
                call $write.unknown
                return
            )
        ;; }

        ;; { unpack
            (func $virtual.unpack.offset (result i32) i32.const 40)
            (elem (i32.const 40)
                $virtual.unpack.unknown ;; Nothing
                $virtual.unpack.unknown ;; Print
                $virtual.unpack.unknown ;; Int32.instance
                $virtual.unpack.unknown ;; Program.instance
                $Pack.instance.unpack   ;; Pack.instance
                $virtual.unpack.unknown ;; __le__
                $virtual.unpack.unknown ;; __mul__
                $virtual.unpack.unknown ;; __sub__
            )
            (type $virtual.unpack (func (param $something i32) (param $index i32) (result i32)))
            (func $virtual.unpack (param $something i32) (param $index i32) (result i32)
                local.get $something
                local.get $index

                local.get $something
                call $something.type
                call $virtual.unpack.offset
                i32.add
                call_indirect (type $virtual.unpack)
            )
            (func $virtual.unpack.unknown (param $something i32) (param $index i32) (result i32)
                call $global.nothing
                return
            )
        ;; }

        ;; { if
            (func $virtual.if.offset (result i32) i32.const 60)
            (elem (i32.const 60)
                $virtual.if.unknown ;; Nothing
                $virtual.if.unknown ;; Print
                $Int32.instance.if  ;; Int32.instance
                $virtual.if.unknown ;; Program.instance
                $virtual.if.unknown ;; Pack.instance
                $virtual.if.unknown ;; __le__
                $virtual.if.unknown ;; __mul__
                $virtual.if.unknown ;; __sub__
            )
            (type $virtual.if (func (param $something i32) (result i32)))
            (func $virtual.if (param $something i32) (result i32)
                local.get $something

                local.get $something
                call $something.type
                call $virtual.if.offset
                i32.add
                call_indirect (type $virtual.if)
            )
            (func $virtual.if.unknown (param $something i32) (result i32)
                i32.const 0
                return
            )
        ;; }

        ;; { programs
            (func $virtual.program.offset (result i32) i32.const 100)
            (elem (i32.const 100))
            (type $virtual.program (func (param $target i32) (param $input i32) (result i32)))
            (func $virtual.program (param $target i32) (param $input i32) (result i32)
                local.get $target
                local.get $input

                local.get $target
                call $Program.instance.index
                call $virtual.program.offset
                i32.add
                call_indirect (type $virtual.program)
            )
            (func $virtual.program.unknown (param $target i32) (param $input i32) (result i32)
                call $write.ERROR
                call $write.newline

                call $global.nothing
                return
            )
        ;; }
    ;; }

    ;; { Something
        (func $something.type (param $something i32) (result i32)
            local.get $something
            i32.load
            return
        )
        (func $something.type.set (param $something i32) (param $type i32)
            local.get $something
            local.get $type
            i32.store
        )
    ;; }

    ;; { Nothing
        (func $sizeof.Nothing (result i32)
            i32.const 4
            return
        )
        (func $Nothing.constructor (result i32)
            (local $nothing i32)
            ;; allocate
            call $sizeof.Nothing
            call $mem.allocate
            local.set $nothing
            ;; nothing.type = type.Nothing
            local.get $nothing
            call $type.Nothing
            call $something.type.set
            ;; return
            local.get $nothing
            return
        )
        (func $Nothing.print (param $nothing i32)
            call $write.nothing
            return
        )
    ;; }

    ;; { Variable
        (func $sizeof.Variable (result i32)
            i32.const 4
            return
        )
        (func $Variable.target.offset (result i32)
            i32.const 0
            return
        )
        (func $Variable.target (param $variable i32) (result i32)
            local.get $variable
            call $Variable.target.offset
            i32.add
            i32.load
            return
        )
        (func $Variable.target.set (param $variable i32) (param $target i32)
            local.get $variable
            call $Variable.target.offset
            i32.add
            local.get $target
            i32.store
        )
        (func $Variable.constructor (param $target i32) (result i32)
            (local $variable i32)
            ;; allocate
            call $sizeof.Variable
            call $mem.allocate
            local.set $variable
            ;; variable.target = target
            local.get $variable
            local.get $target
            call $Variable.target.set
            ;; return
            local.get $variable
            return
        )
    ;; }

    ;; { Pack.instance
        (func $sizeof.Pack.instance.header (result i32)
            i32.const 8
            return
        )
        (func $sizeof.Pack.instance (param $length i32) (result i32)
            local.get $length
            i32.const 4
            i32.mul
            call $sizeof.Pack.instance.header
            i32.add
            return
        )
        (func $Pack.instance.length.offset (result i32)
            i32.const 4
            return
        )
        (func $Pack.instance.length (param $pack i32) (result i32)
            local.get $pack
            call $Pack.instance.length.offset
            i32.add
            i32.load
            return
        )
        (func $Pack.instance.length.set (param $pack i32) (param $length i32)
            local.get $pack
            call $Pack.instance.length.offset
            i32.add
            local.get $length
            i32.store
        )
        (func $Pack.instance.first.offset (result i32)
            call $sizeof.Pack.instance.header
            return
        )
        (func $Pack.instance.first (param $pack i32) (result i32)
            local.get $pack
            call $Pack.instance.first.offset
            i32.add
            return
        )
        (func $Pack.instance.set_at (param $pack i32) (param $index i32) (param $value i32)
            local.get $pack
            call $Pack.instance.first
            local.get $index
            i32.const 4
            i32.mul
            i32.add
            local.get $value
            i32.store
        )
        (func $Pack.instance.get_at (param $pack i32) (param $index i32) (result i32)
            local.get $pack
            call $Pack.instance.first
            local.get $index
            i32.const 4
            i32.mul
            i32.add
            i32.load
            return
        )
        (func $Pack.instance.constructor (param $length i32) (result i32)
            (local $pack i32)
            ;; allocate
            local.get $length
            call $sizeof.Pack.instance
            call $mem.allocate
            local.set $pack
            ;; pack.type = type.Pack.instance
            local.get $pack
            call $type.Pack.instance
            call $something.type.set
            ;; pack.length = length
            local.get $pack
            local.get $length
            call $Pack.instance.length.set
            ;; return pack
            local.get $pack
            return
        )
        (func $Pack.instance.print (param $pack i32)
            call $write.pack
        )
        (func $Pack.instance.unpack (param $pack i32) (param $index i32) (result i32)
            local.get $pack
            local.get $index
            call $Pack.instance.get_at
        )
    ;; }

    ;; { Program
        (func $sizeof.Program.instance.header (result i32)
            i32.const 12
            return
        )
        (func $sizeof.Program.instance (param $closure_length i32) (result i32)
            call $sizeof.Program.instance.header
            local.get $closure_length
            i32.const 4
            i32.mul
            i32.add
            return ;; header + closure_length * 4
        )
        (func $Program.instance.closure.length.offset (result i32)
            i32.const 4
            return
        )
        (func $Program.instance.closure.length (param $program i32) (result i32)
            local.get $program
            call $Program.instance.closure.length.offset
            i32.add
            i32.load
            return
        )
        (func $Program.instance.closure.length.set (param $program i32) (param $length i32)
            local.get $program
            call $Program.instance.closure.length.offset
            i32.add
            local.get $length
            i32.store
        )
        (func $Program.instance.closure.first.offset (result i32)
            call $sizeof.Program.instance.header
            return
        )
        (func $Program.instance.closure.first (param $program i32) (result i32)
            local.get $program
            call $Program.instance.closure.first.offset
            i32.add
            return
        )
        (func $Program.instance.closure.get_at (param $program i32) (param $i i32) (result i32)
            local.get $program
            call $Program.instance.closure.first
            local.get $i
            i32.const 4
            i32.mul
            i32.add
            i32.load
            return ;; [first + i*4]
        )
        (func $Program.instance.closure.set_at (param $program i32) (param $i i32) (param $value i32)
            local.get $program
            call $Program.instance.closure.first
            local.get $i
            i32.const 4
            i32.mul
            i32.add
            local.get $value
            i32.store
            ;; [first + i*4] = value
        )
        (func $Program.instance.index.offset (result i32)
            i32.const 8
            return
        )
        (func $Program.instance.index (param $program i32) (result i32)
            local.get $program
            call $Program.instance.index.offset
            i32.add
            i32.load
            return
        )
        (func $Program.instance.index.set (param $program i32) (param $index i32)
            local.get $program
            call $Program.instance.index.offset
            i32.add
            local.get $index
            i32.store
        )
        (func $Program.instance.constructor (param $closure_length i32) (param $index i32) (result i32)
            (local $program i32)
            ;; allocate
            local.get $closure_length
            call $sizeof.Program.instance
            call $mem.allocate
            local.set $program
            ;; program.type = type.Program
            local.get $program
            call $type.Program.instance
            call $something.type.set
            ;; program.index = index
            local.get $program
            local.get $index
            call $Program.instance.index.set
            ;; return
            local.get $program
            return
        )
        (func $Program.instance.call (param $program i32) (param $input i32) (result i32)
            local.get $program
            local.get $input
            call $virtual.program
        )
    ;; }

    ;; { Print
        (func $sizeof.Print (result i32)
            i32.const 4
            return
        )
        (func $Print.constructor (result i32)
            (local $print i32)
            ;; allocate
            call $sizeof.Print
            call $mem.allocate
            local.set $print
            ;; print.type = type.Print
            local.get $print
            call $type.Print
            call $something.type.set
            ;; return
            local.get $print
            return
        )
        (func $Print.call (param $print i32) (param $input i32) (result i32)
            local.get $input
            call $virtual.print
            call $write.newline

            ;; return
            call $global.nothing
            return
        )
        (func $Print.print (param $print i32)
            call $write.print
            return
        )
    ;; }

    ;; { Int32.instance
        (func $sizeof.Int32.instance (result i32)
            i32.const 8
            return
        )
        (func $Int32.instance.value.offset (result i32)
            i32.const 4
            return
        )
        (func $Int32.instance.value (param $int32 i32) (result i32)
            local.get $int32
            call $Int32.instance.value.offset
            i32.add
            i32.load
            return
        )
        (func $Int32.instance.value.set (param $int32 i32) (param $value i32)
            local.get $int32
            call $Int32.instance.value.offset
            i32.add
            local.get $value
            i32.store
        )
        (func $Int32.instance.constructor (param $value i32) (result i32)
            (local $int32 i32)
            ;; allocate
            call $sizeof.Int32.instance
            call $mem.allocate
            local.set $int32
            ;; int32.type = type.Int32.instance
            local.get $int32
            call $type.Int32.instance
            call $something.type.set
            ;; int32.value = value
            local.get $int32
            local.get $value
            call $Int32.instance.value.set
            ;; return int32
            local.get $int32
            return
        )
        (func $Int32.instance.__sub__ (param $int32 i32) (param $right i32) (result i32)
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            (if (then
                local.get $int32
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.sub
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $Int32.instance.__mul__ (param $int32 i32) (param $right i32) (result i32)
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            (if (then
                local.get $int32
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.mul
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $Int32.instance.__le__ (param $int32 i32) (param $right i32) (result i32)
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            (if (then
                local.get $int32
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.le_s
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $Int32.instance.call_pack (param $int32 i32) (param $pack i32) (result i32)
            (local $message i32)

            local.get $pack
            i32.const 0
            call $Pack.instance.get_at
            local.set $message

            local.get $message
            call $global.__mul__
            i32.eq
            (if (then
                local.get $int32
                local.get $pack
                i32.const 1
                call $Pack.instance.get_at
                call $Int32.instance.__mul__
                return
            ))

            local.get $message
            call $global.__sub__
            i32.eq
            (if (then
                local.get $int32
                local.get $pack
                i32.const 1
                call $Pack.instance.get_at
                call $Int32.instance.__sub__
                return
            ))

            local.get $message
            call $global.__le__
            i32.eq
            (if (then
                local.get $int32
                local.get $pack
                i32.const 1
                call $Pack.instance.get_at
                call $Int32.instance.__le__
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $Int32.instance.call (param $int32 i32) (param $input i32) (result i32)
            local.get $input
            call $something.type
            call $type.Pack.instance
            i32.eq
            (if (then
                local.get $int32
                local.get $input
                call $Int32.instance.call_pack
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $Int32.instance.print (param $int32 i32)
            local.get $int32
            call $Int32.instance.value
            call $print.int32
        )
        (func $Int32.instance.if (param $int32 i32) (result i32)
            local.get $int32
            call $Int32.instance.value
            i32.const 0
            i32.ne
            return ;; return int32.value != 0
        )
    ;; }

    ;; { __le__
        (func $sizeof.__le__ (result i32)
            i32.const 4
            return
        )
        (func $__le__.constructor (result i32)
            (local $__le__ i32)
            ;; allocate
            call $sizeof.__le__
            call $mem.allocate
            local.set $__le__
            ;; __le__.type = type.__le__
            local.get $__le__
            call $type.__le__
            call $something.type.set
            ;; return
            local.get $__le__
            return
        )
        (func $__le__.call (param $__le__ i32) (param $input i32) (result i32)
            (local $left i32)
            (local $right i32)

            local.get $input
            i32.const 0
            call $virtual.unpack
            local.set $left

            local.get $input
            i32.const 1
            call $virtual.unpack
            local.set $right

            local.get $left
            call $something.type
            call $type.Int32.instance
            i32.eq
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            i32.and
            (if (then
                local.get $left
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.le_s
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $__le__.print (param $print i32)
            call $write.__le__
            return
        )
    ;; }

    ;; { __mul__
        (func $sizeof.__mul__ (result i32)
            i32.const 4
            return
        )
        (func $__mul__.constructor (result i32)
            (local $__mul__ i32)
            ;; allocate
            call $sizeof.__mul__
            call $mem.allocate
            local.set $__mul__
            ;; __mul__.type = type.__mul__
            local.get $__mul__
            call $type.__mul__
            call $something.type.set
            ;; return
            local.get $__mul__
            return
        )
        (func $__mul__.call (param $__mul__ i32) (param $input i32) (result i32)
            (local $left i32)
            (local $right i32)

            local.get $input
            i32.const 0
            call $virtual.unpack
            local.set $left

            local.get $input
            i32.const 1
            call $virtual.unpack
            local.set $right

            local.get $left
            call $something.type
            call $type.Int32.instance
            i32.eq
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            i32.and
            (if (then
                local.get $left
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.mul
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $__mul__.print (param $print i32)
            call $write.__mul__
            return
        )
    ;; }

    ;; { __sub__
        (func $sizeof.__sub__ (result i32)
            i32.const 4
            return
        )
        (func $__sub__.constructor (result i32)
            (local $__sub__ i32)
            ;; allocate
            call $sizeof.__sub__
            call $mem.allocate
            local.set $__sub__
            ;; __sub__.type = type.__sub__
            local.get $__sub__
            call $type.__sub__
            call $something.type.set
            ;; return
            local.get $__sub__
            return
        )
        (func $__sub__.call (param $__sub__ i32) (param $input i32) (result i32)
            (local $left i32)
            (local $right i32)

            local.get $input
            i32.const 0
            call $virtual.unpack
            local.set $left

            local.get $input
            i32.const 1
            call $virtual.unpack
            local.set $right

            local.get $left
            call $something.type
            call $type.Int32.instance
            i32.eq
            local.get $right
            call $something.type
            call $type.Int32.instance
            i32.eq
            i32.and
            (if (then
                local.get $left
                call $Int32.instance.value
                local.get $right
                call $Int32.instance.value
                i32.sub
                call $Int32.instance.constructor
                return
            ))

            ;; return
            call $global.nothing
            return
        )
        (func $__sub__.print (param $print i32)
            call $write.__sub__
            return
        )
    ;; }

    (func $init
        call $heap.init

        call $global.nothing.address
        call $Nothing.constructor
        i32.store

        call $global.print.address
        call $Print.constructor
        i32.store

        call $global.__le__.address
        call $__le__.constructor
        i32.store

        call $global.__mul__.address
        call $__mul__.constructor
        i32.store

        call $global.__sub__.address
        call $__sub__.constructor
        i32.store
    )

    (func $main)

    ;; { exports
        (export "memory"         (memory $memory))
        (export "heap_available" (func $heap.available))
        (export "heap_max"       (func $heap.max))
        (export "main"           (func $main))
    ;; }

    ;; (start $main)
)
