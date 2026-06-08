import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: {
        title: '工作台',
        icon: '\u25C6',
      },
    },
    {
      path: '/json',
      name: 'json',
      component: () => import('@/views/JsonTool.vue'),
      meta: {
        title: 'JSON 编辑器',
        icon: '{}',
      },
    },
    {
      path: '/yaml-json',
      name: 'yaml-json',
      component: () => import('@/views/YamlConverterTool.vue'),
      meta: {
        title: 'YAML/JSON 互转',
        icon: '\u21C4',
      },
    },
    {
      path: '/saasyy-downloader',
      name: 'saasyy-downloader',
      component: () => import('@/views/SaasyyDownloaderTool.vue'),
      meta: {
        title: 'SaaSSY 下载器',
        icon: '\u2B07',
      },
    },
    {
      path: '/html-to-pdf',
      name: 'html-to-pdf',
      component: () => import('@/views/HtmlToPdfTool.vue'),
      meta: {
        title: 'HTML 转 PDF',
        icon: '\uD83D\uDCC4',
      },
    },
    {
      path: '/saasyy-pdf-converter',
      redirect: '/saasyy-downloader',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
