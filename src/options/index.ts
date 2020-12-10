import './index.scss';
import '@/common/shared.scss';
import { createApp } from 'vue';
import Options from './Options.vue';
import AxiosApi from '@/common/api/AxiosApi';
import { store } from '@/common/store';

// Setup Globals

global.Api = AxiosApi;

// Inject DOM

createApp(Options)
  .use(store)
  .mount('#app');
