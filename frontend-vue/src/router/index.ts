import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/visualization',
      name: 'Visualization',
      component: () => import('../views/Visualization.vue')
    },
    {
      path: '/simulation',
      name: 'Simulation',
      component: () => import('../views/Simulation.vue')
    },
    {
      path: '/communication',
      name: 'Communication',
      component: () => import('../views/Communication.vue')
    }
  ]
})

export default router
