import { createRouter, createWebHistory, } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


const routers:Array<RouteRecordRaw> = [
    {
        path: '/login',
        component:()=> import('../components/Login.vue')
    },
    {
        path: '/main',
        component:()=> import('../components/Main.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: routers
  })
  
  export default router