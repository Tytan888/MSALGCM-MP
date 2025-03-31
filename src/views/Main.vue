<template>
    <div class='flex flex-col items-center justify-center h-full'>
        <div id="graph" ref="graphContainer" class="flex w-full h-8/10 bg-soft">
        </div>

        <div class="flex h-1/10 w-full justify-center items-center">
            <div class=" ml-10 mr-10 flex flex-col">
                <h1>Total Timelines: {{ num_timelines }}</h1>
                <select v-model="selected_timeline" @change="reload_graph(selected_timeline, false)">
                    <option v-for="n in num_timelines" :value="n - 1">{{ n - 1 }}</option>
                </select>
            </div>
            <div class="flex flex-col ml-10 mr-10 ">
                <button
                    class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-0 me-2 mb-1 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                    @click="next" v-if="!rejected && !accepted">Next</button>
                <h1 v-if="rejected" class='text-red-500'>Rejected...</h1>
                <h1 v-if="accepted" class='text-green-400'>Accepted!</h1>
                <h1>t = {{ time }}</h1>
            </div>
            <div class=" ml-10 mr-10 flex flex-col">
                <div><span>Input String: </span><span>{{ input_string_1 }}</span><span class="text-cyan-400">{{
                    input_string_2 }}</span><span>{{ input_string_3 }}</span></div>
                <div><span>Output String: </span> {{ output_string }}_</div>
            </div>


            <label class="inline-flex items-center cursor-pointer">
                <span class="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">State Name</span>
                <input @click="toggle_label()" type="checkbox" class="sr-only peer" checked>
                <div
                    class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600">
                </div>
                <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">State Type</span>
            </label>


            <button
                class="mr-6 ml-6 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2 me-2 mb-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-green-800"
                @click="back">Back to Start Page</button>
        </div>
        <div v-if="memory_names.length != 0" class="flex h-1/10 w-full justify-center items-center bg-mute">
            <select class="ml-3 mr-3" v-model="selected_memory"
                @change="reload_memory(selected_memory, selected_timeline)">
                <option v-for="memory in memory_names" :value="memory">{{ memory }}</option>
            </select>
            <div class="scrollable">
                <pre>{{ memory_1 }}<span class="text-cyan-400">{{ memory_2 }}</span>{{ memory_3 }}</pre>
            </div>
        </div>
    </div>
</template>


<script>
import cytoscape from 'cytoscape'
import { useSpecsStore } from '@/store'
import arrow from '@/assets/right-arrow.png'
import _ from 'lodash'

function get_transition_id(state, transition) {
    if (transition.length == 2)
        return state.name + transition[0] + transition[1]
    else
        return state.name + transition[0] + transition[1] + transition[2]
}



export default {
    name: 'Main',
    data() {
        return {
            cy: null,
            rejected: false,
            accepted: false,
            input_string_1: '',
            input_string_2: '',
            input_string_3: '',
            output_string: '',
            time: 0,
            num_timelines: 0,
            selected_timeline: 0,
            memory_names: "",
            selected_memory: "",
            memory_1: "",
            memory_2: "",
            memory_3: ""
        }
    },
    methods: {
        next: function () {
            const specsStore = useSpecsStore()
            const next_timeline = specsStore.next(this.selected_timeline)
            this.time++
            let timeline_index = 0
            if (specsStore.good_timeline_index != -1) {
                timeline_index = specsStore.good_timeline_index
                this.accepted = true
                this.selected_timeline = timeline_index
            } else {
                timeline_index = next_timeline
                this.selected_timeline = timeline_index
            }
            this.reload_graph(timeline_index, false)
            if (specsStore.memory_names.length != 0)
                this.reload_memory(this.selected_memory, timeline_index)
        },
        back: function () {
            this.$router.push({ name: 'Start' }).then(() => {
                window.location.reload()
            });
        },
        toggle_label: function () {
            this.cy.$('.display-label').removeClass("display-label")
            this.cy.$('.display-id').removeClass("display-id")


            let nodes_ids = this.cy.nodes().map(x => x.id())
            for (let node of nodes_ids) {
                if (document.querySelector('input[type="checkbox"]').checked) {
                    this.cy.getElementById(node).addClass('display-label')
                } else {
                    this.cy.getElementById(node).addClass('display-id')
                }
            }
        },
        reload_graph: function (timeline = 0, full_reload = true) {
            const showNames = false
            const specsStore = useSpecsStore()

            if (full_reload) {
                if (this.cy) {
                    this.cy.destroy();
                    this.cy = null;
                }

                let elements = []
                let displayAccept = false
                let displayReject = false

                specsStore.states.forEach(state => {
                    if (showNames)
                        elements.push({ data: { id: state.name, label: state.name + "-" + state.type_name } })
                    else
                        elements.push({ data: { id: state.name, label: state.type_name } })


                    state.transitions.forEach(transition => {
                        if (state.type_name.startsWith("右") || state.type_name.startsWith("左") || state.type_name.startsWith("上") || state.type_name.startsWith("下")) {
                            if (transition[0] != transition[1])
                                elements.push({ data: { id: get_transition_id(state, transition), source: state.name, target: transition[2], label: transition[0] + " / " + transition[1] } })
                            else {
                                elements.push({ data: { id: get_transition_id(state, transition), source: state.name, target: transition[2], label: transition[0] } })
                            }
                            if (transition[2] == 'accept')
                                displayAccept = true
                            if (transition[2] == 'reject')
                                displayReject = true
                        } else {
                            elements.push({ data: { id: get_transition_id(state, transition), source: state.name, target: transition[1], label: transition[0] } })
                            if (transition[1] == 'accept')
                                displayAccept = true
                            if (transition[1] == 'reject')
                                displayReject = true
                        }
                    })
                })

                if (!displayAccept)
                    _.remove(elements, function (element) {
                        return element.data.id == 'accept'
                    })
                if (!displayReject)
                    _.remove(elements, function (element) {
                        return element.data.id == 'reject'
                    })

                this.cy = cytoscape({
                    container: this.$refs.graphContainer,
                    elements: elements,
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'background-color': 'lightblue',
                                'text-rotation': 'autorotate',
                                'text-margin-y': 35,
                                'color': 'blue',
                                'width': 50,
                                'height': 50
                            }
                        },
                        {
                            selector: '.display-id',
                            style: {
                                'label': 'data(id)'
                            }
                        },
                        {
                            selector: '.display-label',
                            style: {
                                'label': 'data(label)'
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 4,
                                'line-color': '#488',
                                'target-arrow-shape': 'triangle',
                                'curve-style': 'bezier',
                                'label': 'data(label)',
                                'text-rotation': 'none',
                                'color': 'white',
                                'font-weight': 'bold',
                                'font-size': '18px'
                            }
                        },
                        {
                            selector: '.start',
                            style: {
                                'background-image': `url(${arrow})`,
                                'background-fit': 'cover',
                                'background-position-x': '-50px',
                                'background-clip': 'none',
                                'bounds-expansion': '50px'
                            }
                        },
                        {
                            selector: '.current',
                            style: {
                                'background-color': 'lightgreen'
                            }
                        }
                    ],
                    layout: {
                        name: 'circle'
                    }
                })


                let nodes_ids = this.cy.nodes().map(x => x.id())
                for (let node of nodes_ids) {
                    if (document.querySelector('input[type="checkbox"]').checked) {
                        this.cy.getElementById(node).addClass('display-label')
                    } else {
                        this.cy.getElementById(node).addClass('display-id')
                    }
                }

                this.cy.getElementById(specsStore.start_state).addClass('start')
            }

            this.num_timelines = specsStore.timelines.length

            if (specsStore.timelines.length == 0) {
                this.rejected = true
                return
            }
            else {
                this.cy.$('.current').removeClass("current")
                this.cy.getElementById(specsStore.timelines[timeline].current_state).addClass('current')
            }

            this.output_string = specsStore.timelines[timeline].output_string

            this.input_string_1 = specsStore.input_string.substring(0, specsStore.timelines[timeline].input_string_position)
            this.input_string_2 = specsStore.input_string.substring(specsStore.timelines[timeline].input_string_position, specsStore.timelines[timeline].input_string_position + 1)
            this.input_string_3 = specsStore.input_string.substring(specsStore.timelines[timeline].input_string_position + 1)
        },
        reload_memory: function (memory_name, timeline) {
            const specsStore = useSpecsStore()
            const TAPE_X_DISPLAY = 51
            const TAPE_Y_DISPLAY = 3
            if (specsStore.timelines.length == 0) {
                this.memory_1 = ''
                this.memory_2 = ''
                this.memory_3 = ''
                return
            }
            let memory = specsStore.timelines[timeline].get_memory(memory_name)
            let memory_type = memory.type
            if (memory_type == 'STACK') {
                if (memory.data.length == 0) {
                    this.memory_1 = ''
                    this.memory_2 = ''
                    this.memory_3 = ''
                }
                else if (memory.data.length == 1) {
                    this.memory_1 = ''
                    this.memory_2 = memory.data[0]
                    this.memory_3 = ''
                }
                else if (memory.data.length == 2) {
                    this.memory_1 = memory.data[0]
                    this.memory_2 = memory.data[1]
                    this.memory_3 = ''
                }
                else {
                    this.memory_1 = memory.data.slice(0, -1).join("");
                    this.memory_2 = memory.data[memory.data.length - 1]
                    this.memory_3 = ''
                }
                this.memory_3 += '_'
            }
            else if (memory_type == "QUEUE") {
                if (memory.data.length == 0) {
                    this.memory_1 = ''
                    this.memory_2 = ''
                    this.memory_3 = ''
                }
                else if (memory.data.length == 1) {
                    this.memory_1 = ''
                    this.memory_2 = memory.data[0]
                    this.memory_3 = ''
                }
                else if (memory.data.length == 2) {
                    this.memory_1 = ''
                    this.memory_2 = memory.data[0]
                    this.memory_3 = memory.data[1]
                }
                else {
                    this.memory_1 = ''
                    this.memory_2 = memory.data[0]
                    this.memory_3 = memory.data.slice(1).join("");
                }
                this.memory_3 += '_'
            }
            else if (memory_type == "1D") {
                this.memory_1 = ""
                this.memory_2 = ""
                this.memory_3 = ""

                this.memory_1 += "<-"
                for (let offset = -Math.floor(TAPE_X_DISPLAY / 2); offset < 0; offset++) {
                    this.memory_1 += memory.data[memory.position + offset]
                }
                this.memory_2 += memory.data[memory.position]
                for (let offset = 1; offset < Math.floor(TAPE_X_DISPLAY / 2); offset++) {
                    this.memory_3 += memory.data[memory.position + offset]
                }
                this.memory_3 += "->"
            }
            else if (memory_type == "2D") {
                this.memory_1 = ""
                this.memory_2 = ""
                this.memory_3 = ""
                for (let y_offset = -Math.floor(TAPE_Y_DISPLAY / 2); y_offset <= Math.floor(TAPE_Y_DISPLAY / 2); y_offset++) {
                    if (y_offset == 0) {
                        this.memory_1 += "<-"
                        for (let offset = -Math.floor(TAPE_X_DISPLAY / 2); offset < 0; offset++) {
                            this.memory_1 += memory.data[memory.x_position + offset][memory.y_position + y_offset]
                        }
                        this.memory_2 += memory.data[memory.x_position][memory.y_position]
                        for (let offset = 1; offset < Math.floor(TAPE_X_DISPLAY / 2); offset++) {
                            this.memory_3 += memory.data[memory.x_position + offset][memory.y_position + y_offset]
                        }
                        this.memory_3 += "->\n"
                    } else if (y_offset < 0) {
                        this.memory_1 += "<-"
                        for (let offset = -Math.floor(TAPE_X_DISPLAY / 2); offset < Math.floor(TAPE_X_DISPLAY / 2); offset++) {
                            this.memory_1 += memory.data[memory.x_position + offset][memory.y_position + y_offset]
                        }
                        this.memory_1 += "->\n"
                    } else if (y_offset > 0) {
                        this.memory_3 += "<-"
                        for (let offset = -Math.floor(TAPE_X_DISPLAY / 2); offset < Math.floor(TAPE_X_DISPLAY / 2); offset++) {
                            this.memory_3 += memory.data[memory.x_position + offset][memory.y_position + y_offset]
                        }
                        this.memory_3 += "->\n"
                    }
                }
            }
        },
    },
    mounted() {
        this.reload_graph()
        const specsStore = useSpecsStore()
        this.memory_names = specsStore.memory_names
        this.selected_memory = specsStore.memory_names[0]
        if (specsStore.memory_names.length != 0) {
            this.reload_memory(this.selected_memory, 0)
        }
    },

    beforeDestroy() {
        if (this.cy) {
            this.cy.destroy();
            this.cy = null;
        }
    }
}
</script>