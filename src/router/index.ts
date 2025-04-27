import { createRouter, createWebHistory, } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


const routers:Array<RouteRecordRaw> = [
    {
        path: '/',
        name:'Login',
        component:()=> import('../components/Login.vue')
    },
    {
        path: '/main',
        name:'Main',
        component:()=> import('../components/Main.vue')
    },
    {
        path: '/register',
        name:'Register',
        component:()=> import('../components/Register.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: routers
  })
  
export default router