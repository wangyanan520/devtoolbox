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
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
