// Pages you can open without an account.
const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useAuth();
  const isPublic = PUBLIC_PAGES.includes(to.path);

  if (!loggedIn.value && !isPublic) {
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} });
  }
  // Already logged in: skip the login/register screens. Reset links still work.
  if (loggedIn.value && isPublic && to.path !== '/reset-password') {
    return navigateTo('/');
  }
});
