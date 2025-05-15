import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

const routers: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Login',
        component: () => import('../components/Login.vue'),
    },
    {
        path: '/main',
        name: 'Main',
        component: () => import('../components/Main.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../components/Register.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes: routers,
})

const whiteList = ['/', '/register']

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    if (whiteList.includes(to.path)) {
            next()
    }
    if(token){
        try{
            const payload: {exp:number} = jwtDecode(token)
            const now = Date.now()/1000
            if(payload.exp && payload.exp < now){
                next('/')
            }
            return next()
        }catch(err){
            return next('/')
        }
    }else{
        return next('/')
    }
})
export default router
