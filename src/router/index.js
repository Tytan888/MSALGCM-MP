import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Start',
      component: () => import('../views/Start.vue')
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('../views/Main.vue')
    },
  ]
})

export default router
