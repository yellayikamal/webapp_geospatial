import { createApp } from 'vue';  // Import createApp from Vue 3
import App from './App.vue';
import router from './router';
// main.js
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';


createApp(App)
  .use(router)  // Use the router in Vue 3
  .mount('#app');
