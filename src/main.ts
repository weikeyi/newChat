import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue';
import 'ant-design-vue/dist/reset.css';
import { createPinia } from 'pinia'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

const whiteList = ['/','/register']

router.beforeEach((to,from,next)=>{
    if(whiteList.includes(to.path)|| localStorage.getItem('token')){ {
        next()
    }}
    else {
        next('/')
    }
})



app.mount('#app')