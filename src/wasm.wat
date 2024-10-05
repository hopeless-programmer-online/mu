(module
    (import "print" "int32" (func $print.int32 (param i32)))
    (import "print" "ascii" (func $print.ascii (param i32) (param i32)))

    (memory $memory 1)
    ;; { memory mapping
        ;; text
        (data (i32.const 0)   "\n")           (; 0 + 1 = 1 ;)      (func $write.newline       (call $print.ascii (i32.const 0) (i32.const 1)))
        (data (i32.const 1)   "ERROR")        (; 1 + 5 = 6 ;)      (func $write.ERROR         (call $print.ascii (i32.const 1) (i32.const 5)))
        (data (i32.const 6)   "unknown")      (; 6 + 7 = 13 ;)     (func $write.unknown       (call $print.ascii (i32.const 6) (i32.const 7)))
        (data (i32.const 13)  "nothing")      (; 13 + 7 = 20 ;)    (func $write.nothing       (call $print.ascii (i32.const 13) (i32.const 7)))
        ;; globals
        (func $global.nothing.address (result i32) i32.const 768 return) (func $global.nothing (result i32) call $global.nothing.address i32.load return)
        (func $global.print.address   (result i32) i32.const 772 return) (func $global.print   (result i32) call $global.print.address i32.load return)
        ;; heap
        (func $heap.begin (result i32) i32.const 0)
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
        (func $type.Nothing        (result i32) i32.const 0 return)
        (func $type.Print          (result i32) i32.const 1 return)
        (func $type.Int32.instance (result i32) i32.const 2 return)
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
    ;; }

    (func $call (param $target i32) (param $input i32) (result i32)
        local.get $target
        call $something.type
        call $print.int32
        call $write.newline

        ;; @todo

        call $global.nothing
        return
    )

    (func $init
        call $heap.init

        call $global.nothing.address
        call $Nothing.constructor
        i32.store

        call $global.print.address
        call $Print.constructor
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
