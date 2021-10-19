import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from './plugins/vuetify'
import router from './router'
import i18n from './plugins/i18n'
import { store, key } from './store/index'
import { offlineDB } from './Data/offline'
const st = performance.now()
offlineDB.on('ready', () => {
  return offlineDB.init(() => {
    console.log(
      `${performance.now() - st} ms passed during init`,
      offlineDB.initialized
    )
    createApp(App)
      .use(store, key)
      .use(router)
      .use(vuetify)
      .use(i18n)
      .mount('#app')
  })
})

void offlineDB.open()
