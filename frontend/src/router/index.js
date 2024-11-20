import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import FileUpload from '../components/FileUpload.vue';
import ShapeDrawer from '../components/shapeDrawer.vue';
import ManageMarkers from '../components/MarkerManager.vue';
import MeasureDistance from '../components/DistanceMeasure.vue';
import HoverPage from '../components/HoverInfo.vue';

const routes = [
  {
    path: '/',
    name: 'LoginPage',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: RegisterPage,
  },
  {
    path: '/dashboard',
    name: 'DashboardPage',
    component: DashboardPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/upload',
        name: 'FileUpload',
        component: FileUpload,
      },
      {
        path: '/draw',
        name: 'ShapeDrawer',
        component: ShapeDrawer,
      },
      {
        path: '/markers',
        name: 'ManageMarkers',
        component: ManageMarkers,
      },
      {
        path: '/measure',
        name: 'MeasureDistance',
        component: MeasureDistance,
      },
      {
        path: '/hover',
        name: 'HoverInfo',
        component: HoverPage,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("authToken");

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next({ name: 'LoginPage' });
  } else {
    next();
  }
});

export default router;
