<template>

    <div class="flex w-full h-full justify-center items-center bg-custom-dark">
        <div class="flex flex-col items-center w-1/2">
            <label for="specs" class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Input Machine</label>
            <textarea rows="20"
                class="resize-none mb-5 w-full px-3 py-2 text-base text-gray-700 placeholder-gray-400 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                placeholder="Write the machine's specifications here..."></textarea>
            <label for="input" class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Input String</label>
            <input type="text"
                class="mb-7 w-full px-3 py-2 text-base text-gray-700 placeholder-gray-400 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                placeholder="Write the input string here...">
            <button @click="runMain"
                class="w-80 px-6 py-2 text-lg text-white bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-blue-400">Run
                Machine</button>

        </div>
    </div>
</template>

<script>

import { useSpecsStore } from '../store/index';
export default {
  name: 'Start',
  components: {
  },
  methods: {
    runMain() {
        this.specs = document.querySelector('textarea').value;
        this.input = document.querySelector('input').value;
        useSpecsStore().initSpecs(this.specs, this.input);

        this.$router.push({name: 'Main'});
    }
  }
}
</script>
