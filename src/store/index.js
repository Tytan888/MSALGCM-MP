import { defineStore } from "pinia"
import { ref } from "vue"
import _, { first } from 'lodash';

const max_tape_size = 88888888

class Memory {
    name = ""

    constructor(name) {
        this.name = name
    }
}

class Stack extends Memory {
    data = []
    type = "STACK"

    constructor(name) {
        super(name)
        this.data = []
    }

    read() {
        return this.data[this.data.length - 1]
    }

    push(value) {
        this.data.push(value)
    }

    pop() {
        this.data.pop()
    }
}

class Queue extends Memory {
    data = []
    type = "QUEUE"

    constructor(name) {
        super(name)
        this.data = []
    }

    read() {
        return this.data[0]
    }

    push(value) {
        this.data.push(value)
    }

    pop() {
        this.data.shift()
    }
}

class IchiD_Tape extends Memory {
    #data = []
    #position = 0

    constructor(name) {
        super(name)
        this.#data = Array(max_tape_size).fill('#');
        this.#position = max_tape_size / 2
    }

    init_tape(input_string) {
        for (let i = 1; i <= input_string.length; i++) {
            this.#data[this.#position + i] = input_string[i]
        }
    }

    see_left() {
        return this.#data[this.#position - 1]
    }

    see_right() {
        return this.#data[this.#position + 1]
    }

    move_left() {
        this.#position--
    }

    move_right() {
        this.#position++
    }

    write(value) {
        this.#data[this.#position] = value
    }

}

class NiD_Tape extends Memory {
    #data = []
    #x_position = 0
    #y_position = 0

    constructor(name) {
        super(name)
        for (let i = 0; i < max_tape_size; i++) {
            this.#data.push(Array(max_tape_size).fill('#'))
        }
        this.#x_position = max_tape_size / 2
        this.#y_position = max_tape_size / 2
    }

    init_tape(input_string) {
        for (let i = 1; i <= input_string.length; i++) {
            this.#data[this.#x_position + i][this.#y_position] = input_string[i]
        }
    }


    see_left() {
        return this.#data[this.#x_position - 1][this.#y_position]
    }

    see_right() {
        return this.#data[this.#x_position + 1][this.#y_position]
    }

    see_up() {
        return this.#data[this.#x_position][this.#y_position - 1]
    }

    see_down() {
        return this.#data[this.#x_position][this.#y_position + 1]
    }

    move_left() {
        this.#x_position--
    }

    move_right() {
        this.#x_position++
    }

    move_up() {
        this.#y_position--
    }

    move_down() {
        this.#y_position++
    }

    write(value) {
        this.#data[this.#x_position][this.#y_position] = value
    }

}

class State {
    name = ""
    output_string = ""
    type_name = ""
    transitions = []

    constructor(name, type_name) {
        this.name = name
        this.type_name = type_name
    }

    get name() {
        return this.name
    }

    run(og_timeline) {
        if(this.name === "reject") {
            return []
        }
    }
}

class timeline {
    memories = new Map()
    input_string_position = 0
    output_string = ""
    current_state = ""

    constructor(memories, current_state) {
        this.memories = memories
        this.current_state = current_state
    }

    get_memory(name) {
        return this.memories.get(name)
    }

    write_output_string(value) {
        this.output_string += value
    }
}

class Print extends State {

    constructor(name, transitions, type_name) {
        super(name, type_name)
        this.transitions = transitions
    }

    run(og_timeline) {
        let resulting_timelines = []

        for (let transition of this.transitions) {
            let copy_timeline = _.cloneDeep(og_timeline)
            copy_timeline.write_output_string(transition[0])
            copy_timeline.current_state = transition[1]
            resulting_timelines.push(copy_timeline)
        }

        return resulting_timelines
    }
}

class Scan extends State {

    direction = "R"
    input_string = ""

    constructor(name, transitions, direction, input_string, type_name) {
        super(name, type_name)
        this.transitions = transitions
        this.direction = direction
        this.input_string = input_string
    }

    run(og_timeline) {
        let resulting_timelines = []

        for (let transition of this.transitions) {
            let offset = 0
            if (this.direction == "R") {
                offset = 1
            } else if (this.direction == "L") {
                offset = -1
            }

            if (this.input_string[og_timeline.input_string_position + offset] == transition[0]) {
                let copy_timeline = _.cloneDeep(og_timeline)
                copy_timeline.input_string_position = og_timeline.input_string_position + offset
                copy_timeline.current_state = transition[1]
                resulting_timelines.push(copy_timeline)
            }
        }

        return resulting_timelines
    }
}

class Write extends State {
    
        memory = ""
    
        constructor(name, transitions, memory, type_name) {
            super(name, type_name)
            this.transitions = transitions
            this.memory = memory
        }
    
        run(og_timeline) {
            let resulting_timelines = []
    
            for (let transition of this.transitions) {
                let copy_timeline = _.cloneDeep(og_timeline)
                let memory = copy_timeline.get_memory(this.memory)
                memory.push(transition[0])
                copy_timeline.current_state = transition[1]
                resulting_timelines.push(copy_timeline)
            }
    
            return resulting_timelines
        }
}

class Read extends State {
    
        memory = ""
    
        constructor(name, transitions, memory, type_name) {
            super(name, type_name)
            this.transitions = transitions
            this.memory = memory
        }
    
        run(og_timeline) {
            let resulting_timelines = []
    
            for (let transition of this.transitions) {
                let copy_timeline = _.cloneDeep(og_timeline)
                let memory = copy_timeline.get_memory(this.memory)
                if(memory.read() == transition[0]) {
                    memory.pop()
                    copy_timeline.current_state = transition[1]
                    resulting_timelines.push(copy_timeline)
                }
            }
    
            return resulting_timelines
        }
}

export const useSpecsStore = defineStore(
    'specs', {
    state: () => {
        const rawSpecs = ref("")
        const rawInput = ref("")

        const input_string = ref("")
        const states = new Map()
        let timelines = ref([])
        const start_state = ref("")
        const good_timeline_index = ref(-1)
        const memory_names = ref([])

        const initSpecs = (specs, input) => {
            rawSpecs.value = specs
            rawInput.value = input

            input_string.value = "#" + input + "#"

            let reading_data = false
            let reading_logic = false

            let memories = new Map()
            let start_state_name = ""
            let first_tape_name = ""
            for (let line of specs.split("\n")) {
                if (line == ".DATA") {
                    reading_data = true
                    continue
                } else if (line == ".LOGIC") {
                    reading_data = false
                    reading_logic = true
                    continue
                } else if (line.trim() == "") {
                    continue
                }
                if (reading_data) {
                    let memory_type = line.split(" ")[0].trim()
                    let memory_name = line.split(" ")[1].trim()

                    if (memory_type == "STACK") {
                        memories.set(memory_name, new Stack(memory_name))
                    } else if (memory_type == "QUEUE") {
                        memories.set(memory_name, new Queue(memory_name))
                    } else if (memory_type == "TAPE") {
                        memories.set(memory_name, new IchiD_Tape(memory_name))
                    } else if (memory_type == "2D_TAPE") {
                        memories.set(memory_name, new NiD_Tape(memory_name))
                    }

                    if (first_tape_name == "" && (memory_type == "TAPE" || memory_type == "2D_TAPE")) {
                        first_tape_name = memory_name
                    }

                    memory_names.value.push(memory_name)
                }
                if (reading_logic) {
                    let stateName_rest = line.split("]")
                    let stateName = stateName_rest[0]
                    let rest = stateName_rest[1].trim()

                    if (start_state_name == "") {
                        start_state_name = stateName
                        start_state.value = start_state_name
                    }

                    let index = rest.indexOf("(");
                    let stateType = rest.substring(0, index).trim();
                    rest = rest.substring(index);


                    let stateMemory = ""
                    if (stateType == "WRITE" || stateType == "READ" || stateType == "RIGHT" || stateType == "LEFT" || stateType == "UP" || stateType == "DOWN") {
                        let index = rest.indexOf(")");
                        stateMemory = rest.substring(1, index).trim();
                        rest = rest.substring(index);
                    }

                    let stateTransitions = []
                    for (let t of rest.split(")")) {
                        if (t == undefined || t == "") {
                            continue
                        }
                        let transition_string = t.trim().split("(")[1]
                        let first = transition_string.split(",")[0].trim()
                        let second = transition_string.split(",")[1].trim()

                        if (stateType == "RIGHT" || stateType == "LEFT" || stateType == "UP" || stateType == "DOWN") {
                            stateTransitions.push([first.split('/')[0], first.split('/')[1], second])
                        } else {
                            stateTransitions.push([first, second])
                        }
                    }

                    if (stateType == "PRINT") {
                        states.set(stateName, new Print(stateName, stateTransitions, 'P'))
                    } else if (stateType == "SCAN") {
                        states.set(stateName, new Scan(stateName, stateTransitions, 'R', input_string.value, "S"))
                    } else if (stateType == "SCAN RIGHT") {
                        states.set(stateName, new Scan(stateName, stateTransitions, 'R', input_string.value, "SR"))
                    } else if (stateType == "SCAN LEFT") {
                        states.set(stateName, new Scan(stateName, stateTransitions, 'L', input_string.value, "SL"))
                    } else if (stateType == "WRITE") {
                        states.set(stateName, new Write(stateName, stateTransitions, stateMemory, "W-" + stateMemory))
                    }else if (stateType == "READ") {
                        states.set(stateName, new Read(stateName, stateTransitions, stateMemory, "R-" + stateMemory))
                    }
                }

            }

            states.set("accept", new State("accept", "Acc"))
            states.set("reject", new State("reject", "Rej"))

            if (first_tape_name != "")
                memories[first_tape_name].init_tape(input_string.value)
            let first_timeline = new timeline(memories, start_state_name)
            timelines.value.push(first_timeline)

            console.log(states)
        }

        const next = () => {
            let new_timelines = []

            for (let timeline of timelines.value) {
                let current_state = states.get(timeline.current_state)
                let resulting_timelines = current_state.run(timeline)
                new_timelines = new_timelines.concat(resulting_timelines)
            }
            timelines.value = new_timelines

            let good_timelines = timelines.value.filter((timeline) => timeline.current_state == "accept")


            if (good_timelines.length > 0) {
                good_timeline_index.value = timelines.value.indexOf(good_timelines[0])
            }
        }

        return {
            rawSpecs,
            rawInput,
            input_string,
            states,
            timelines,
            start_state,
            good_timeline_index,
            memory_names,
            initSpecs,
            next       
        }
    }
})