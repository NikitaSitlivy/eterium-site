import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import { router } from './router'

// включаем "режим анимаций" только если JS реально загрузился
document.documentElement.classList.add('js')

createApp(App).use(router).mount('#app')
