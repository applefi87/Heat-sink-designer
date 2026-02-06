import { createApp } from "vue";
import { Quasar } from "quasar";
import router from "./router";
import App from "./App.vue";

import "quasar/src/css/index.sass";

const app = createApp(App);
app.use(Quasar, { plugins: {} });
app.use(router);
app.mount("#q-app");
