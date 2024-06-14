import './assets/base.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { trials } from './worker/interface'

const app = createApp(App)
app.use(router)
app.mount('#app')


console.log(trials())
