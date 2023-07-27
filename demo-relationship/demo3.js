import Vue from 'vue'
import { JFlowVuePlugin } from '@joskii/jflow';
import App from './App.vue'
import CustomGroup from './components/PointGroup';

Vue.config.productionTip = false
Vue.use(JFlowVuePlugin, {
  customGroups: {
    CustomGroup
  }
  
});
new Vue({
  render: h => h(App),
}).$mount('#app')
