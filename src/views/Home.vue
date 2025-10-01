<template>
    <div :class="['h-screen flex overflow-hidden', toggleDark ? 'bg-gray-900' : 'bg-gray-50']">
        <!-- Left Panel - Task List -->
        <div
            :class="['w-80 border-r flex flex-col', toggleDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
            <!-- Header -->
            <div
                :class="['p-4 border-b flex items-center justify-between', toggleDark ? 'border-gray-700' : 'border-gray-200']">
                <h1 :class="['text-xl font-semibold', toggleDark ? 'text-gray-100' : 'text-gray-800']">Fii's Work Plan
                </h1>
                <div class="flex items-center gap-1">
                    <Airplay @click="navigateToScreenCapture" class="text-blue-500 inline-block mr-2 cursor-pointer" title="Screen Share (Sender)" />
                    <Monitor @click="navigateToScreenReceiver" class="text-green-500 inline-block mr-2 cursor-pointer" title="Screen Receiver" />
                    <div @click="handleToggleDark" class="cursor-pointer flex items-center gap-1">
                        <Sun class="text-orange-500" v-if="!toggleDark" />
                        <Moon class="text-purple-400" v-else />
                    </div>
                </div>
            </div>

            <!-- Task List -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
                <div v-for="task in tasks" :key="task.id" @click="selectTask(task)" :class="[
                    'p-3 rounded-lg cursor-pointer transition-all duration-200',
                    'hover:shadow-md',
                    selectedTask?.id === task.id
                        ? (toggleDark ? 'bg-pink-900 border-2 border-pink-600 shadow-sm' : 'bg-pink-100 border-2 border-pink-300 shadow-sm')
                        : (toggleDark ? 'bg-pink-950 border border-pink-800' : 'bg-pink-50 border border-pink-100')
                ]">
                    <div class="flex items-center justify-between">
                        <span :class="['font-medium', toggleDark ? 'text-gray-100' : 'text-gray-800']">{{ task.title
                            }}</span>
                        <button @click.stop="deleteTask(task.id)"
                            :class="['transition-colors p-1', toggleDark ? 'text-red-400 hover:text-red-300' : 'text-red-400 hover:text-red-600']">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="tasks.length === 0"
                    :class="['text-center py-8', toggleDark ? 'text-gray-500' : 'text-gray-400']">
                    <p>No tasks yet</p>
                    <p class="text-sm mt-1">Click "Add Task" to get started</p>
                </div>
            </div>

            <!-- Add Task Button -->
            <div :class="['p-3 border-t', toggleDark ? 'border-gray-700' : 'border-gray-200']">
                <button @click="addTask"
                    :class="['w-full font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2',
                        toggleDark ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white']">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                </button>
            </div>
        </div>

        <!-- Right Panel - Task Details -->
        <div class="flex-1 flex flex-col">
            <div v-if="selectedTask" class="flex-1 flex flex-col p-6 space-y-4">
                <!-- Task Title -->
                <div class="mb-2">
                    <input v-model="selectedTask.title" @input="saveTaskDebounced"
                        :class="['w-full text-2xl font-bold bg-transparent border-none outline-none focus:outline-none px-2 py-1 -ml-2 rounded',
                            toggleDark ? 'text-gray-100 hover:bg-gray-800 focus:bg-gray-800 placeholder-gray-500' : 'text-gray-800 hover:bg-gray-50 focus:bg-gray-50 placeholder-gray-400']"
                        placeholder="Task title..." />
                </div>

                <!-- Description Row -->
                <div class="flex-1 flex flex-col min-h-0">
                    <label
                        :class="['text-sm font-semibold mb-2 flex items-center gap-2', toggleDark ? 'text-gray-300' : 'text-gray-700']">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Description
                    </label>
                    <textarea v-model="selectedTask.description" @input="saveTaskDebounced"
                        :class="['flex-1 p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                            toggleDark ? 'border-orange-800 bg-orange-950 text-gray-100 placeholder-gray-500 focus:ring-orange-700' : 'border-orange-200 bg-orange-50 text-gray-800 placeholder-gray-400 focus:ring-orange-300']"
                        placeholder="What needs to be done?"></textarea>
                </div>

                <!-- Focus Row -->
                <div class="flex-1 flex flex-col min-h-0">
                    <label
                        :class="['text-sm font-semibold mb-2 flex items-center gap-2', toggleDark ? 'text-gray-300' : 'text-gray-700']">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Focus
                    </label>
                    <textarea v-model="selectedTask.focus" @input="saveTaskDebounced"
                        :class="['flex-1 p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                            toggleDark ? 'border-sky-800 bg-sky-950 text-gray-100 placeholder-gray-500 focus:ring-sky-700' : 'border-sky-200 bg-sky-50 text-gray-800 placeholder-gray-400 focus:ring-sky-300']"
                        placeholder="What to focus on?"></textarea>
                </div>

                <!-- Remember Row -->
                <div class="flex-1 flex flex-col min-h-0">
                    <label
                        :class="['text-sm font-semibold mb-2 flex items-center gap-2', toggleDark ? 'text-gray-300' : 'text-gray-700']">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Remember
                    </label>
                    <textarea v-model="selectedTask.remember" @input="saveTaskDebounced"
                        :class="['flex-1 p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                            toggleDark ? 'border-emerald-800 bg-emerald-950 text-gray-100 placeholder-gray-500 focus:ring-emerald-700' : 'border-emerald-200 bg-emerald-50 text-gray-800 placeholder-gray-400 focus:ring-emerald-300']"
                        placeholder="Things to remember..."></textarea>
                </div>
            </div>

            <!-- Empty State for Right Panel -->
            <div v-else
                :class="['flex-1 flex items-center justify-center', toggleDark ? 'text-gray-500' : 'text-gray-400']">
                <div class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p class="text-lg">Select a task to view details</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import { Sun, Moon, Airplay, Monitor } from 'lucide-vue-next';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    const navigateToScreenCapture = () => {
        router.push('/screen-capture');
    };

    const navigateToScreenReceiver = () => {
        router.push('/screen-receiver');
    };

    // Task data
    const tasks = ref([]);
    const toggleDark = ref(false);

    const selectedTask = ref(null);
    let taskIdCounter = 1;
    let debounceTimeout = null;

    const handleToggleDark = async () => {
        try {
            const isDark = await window.electronAPI.darkMode.toggle();
            toggleDark.value = isDark;
        } catch (error) {
            console.error('Failed to toggle dark mode:', error);
        }
    };


    // Load tasks from Electron store on mount
    onMounted(async () => {
        try {
            console.log('window.electronAPI:', window.electronAPI);
            console.log('Attempting to load tasks...');
            const loadedTasks = await window.electronAPI.tasks.load();
            console.log('Loaded tasks from disk:', loadedTasks);
            if (loadedTasks && loadedTasks.length > 0) {
                tasks.value = loadedTasks;
                selectedTask.value = loadedTasks[0];
                taskIdCounter = Math.max(...loadedTasks.map(t => t.id)) + 1;
                console.log('Tasks loaded successfully, next ID:', taskIdCounter);
            } else {
                console.log('No tasks to load');
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    });
    // Select task
    const selectTask = (task) => {
        selectedTask.value = task;
    };

    // Add new task
    const addTask = async () => {
        try {
            const newTask = {
                id: taskIdCounter++,
                title: 'New Task',
                description: '',
                focus: '',
                remember: ''
            };
            tasks.value.push(newTask);
            selectedTask.value = newTask;
            console.log('Calling saveTasks with:', tasks.value);
            const result = await window.electronAPI.tasks.save(tasks.value);
            console.log('Save result:', result);
            console.log('Task added and saved:', tasks.value);
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    // Delete task
    const deleteTask = async (id) => {
        const index = tasks.value.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks.value.splice(index, 1);
            if (selectedTask.value?.id === id) {
                selectedTask.value = tasks.value[0] || null;
            }
            await window.electronAPI.tasks.save(tasks.value);
        }
    };

    // Auto-save with debounce
    const saveTaskDebounced = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async () => {
            await window.electronAPI.tasks.save(tasks.value);
            console.log('Tasks saved to disk');
        }, 500);
    };
</script>