import { createRouter, createWebHistory } from 'vue-router'
import PatientHomeView from '../views/PatientHomeView.vue'
import OrderListView from '../views/OrderListView.vue'
import OrderCreateView from '../views/OrderCreateView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'
import PatientReviewView from '../views/PatientReviewView.vue'
import PatientProfileView from '../views/PatientProfileView.vue'
import CompanionOrderHallView from '../views/CompanionOrderHallView.vue'
import CompanionServiceRecordView from '../views/CompanionServiceRecordView.vue'
import CompanionIncomeView from '../views/CompanionIncomeView.vue'
import CompanionWithdrawView from '../views/CompanionWithdrawView.vue'
import CompanionProfileView from '../views/CompanionProfileView.vue'
import CompanionPatientDetailView from '../views/CompanionPatientDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import {
  getActiveRole,
  getTokenByRole,
  normalizeRole,
  ROLE_COMPANION,
  ROLE_PATIENT,
  setActiveRole
} from '../utils/authSession'

const routes = [
  { path: '/login', redirect: '/patient/login' },
  { path: '/patient/login', name: 'patient-login', component: LoginView, meta: { public: true, role: ROLE_PATIENT } },
  { path: '/companion/login', name: 'companion-login', component: LoginView, meta: { public: true, role: ROLE_COMPANION } },
  { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
  {
    path: '/',
    redirect: '/patient/login'
  },

  { path: '/patient/home', name: 'patient-home', component: PatientHomeView, meta: { role: 'patient' } },
  { path: '/patient/orders', name: 'patient-orders', component: OrderListView, meta: { role: 'patient' } },
  { path: '/patient/orders/create', name: 'patient-order-create', component: OrderCreateView, meta: { role: 'patient' } },
  {
    path: '/patient/orders/:orderNo',
    name: 'patient-order-detail',
    component: OrderDetailView,
    props: true,
    meta: { role: 'patient' }
  },
  { path: '/patient/review', name: 'patient-review', component: PatientReviewView, meta: { role: 'patient' } },
  { path: '/patient/profile', name: 'patient-profile', component: PatientProfileView, meta: { role: 'patient' } },

  { path: '/companion/hall', name: 'companion-hall', component: CompanionOrderHallView, meta: { role: 'companion' } },
  {
    path: '/companion/records',
    name: 'companion-records',
    component: CompanionServiceRecordView,
    meta: { role: 'companion' }
  },
  {
    path: '/companion/patient/:orderNo',
    name: 'companion-patient-detail',
    component: CompanionPatientDetailView,
    meta: { role: 'companion' }
  },
  { path: '/companion/income', name: 'companion-income', component: CompanionIncomeView, meta: { role: 'companion' } },
  { path: '/companion/withdraw', name: 'companion-withdraw', component: CompanionWithdrawView, meta: { role: 'companion' } },
  { path: '/companion/profile', name: 'companion-profile', component: CompanionProfileView, meta: { role: 'companion' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.public) {
    const pageRole = to.meta.role ? normalizeRole(to.meta.role) : (typeof to.query.role === 'string' ? normalizeRole(to.query.role) : getActiveRole())
    setActiveRole(pageRole)
    return true
  }

  const targetRole = normalizeRole(to.meta.role || getActiveRole() || ROLE_PATIENT)
  setActiveRole(targetRole)
  const token = getTokenByRole(targetRole)
  if (!token) {
    return targetRole === ROLE_COMPANION ? '/companion/login' : '/patient/login'
  }
  return true
})

export default router
