import type { RouteRecordRaw } from "vue-router";
import MainLayout from "src/layouts/MainLayout.vue";
import IndexPage from "src/pages/IndexPage.vue";
import WizardPage from "src/pages/WizardPage.vue";
import ResultPage from "src/pages/ResultPage.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", component: IndexPage },
      { path: "wizard", component: WizardPage },
      { path: "results", component: ResultPage },
    ],
  },
];

export default routes;
