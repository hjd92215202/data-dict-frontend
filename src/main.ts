import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 引入路由
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router) // 使用路由
app.use(ElementPlus)
app.use(createPinia())
app.mount('#app')