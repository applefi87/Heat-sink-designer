import { configure } from "quasar/wrappers";
import { defineConfig } from "vite";

export default configure(() => {
  return {
    css: ["src/styles/app.scss"],
    boot: ["echarts", "katex"],
    extras: ["roboto-font", "material-icons"],
    build: {
      vueRouterMode: "history",
      vitePlugins: [
        defineConfig({
          define: {
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
          },
        }),
      ],
    },
    framework: {
      config: {},
      plugins: [],
    },
    pwa: {
      workboxMode: "InjectManifest",
      injectPwaMetaTags: true,
      manifest: true,
      swFilename: "sw.js",
      useCredentialsForManifestTag: false,
    },
    sourceFiles: {
      rootComponent: "src/App.vue",
      router: "src/router/index.ts",
      routes: "src/router/routes.ts",
      pwaServiceWorker: "src-pwa/custom-service-worker.ts",
    },
  };
});
