import { createRouter, createWebHashHistory } from 'vue-router'

// Import your components/views
import Home from '../views/Home.vue'
import ScreenCapture from '../views/ScreenCapture.vue'
import ScreenReceiver from '../views/ScreenReceiver.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/screen-capture',
    name: 'ScreenCapture',
    component: ScreenCapture
  },
  {
    path: '/screen-receiver',
    name: 'ScreenReceiver',
    component: ScreenReceiver
  }
]

const router = createRouter({
  // Use hash history for Electron apps
  history: createWebHashHistory(),
  routes
})

export default router