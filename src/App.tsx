import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import LandingPage from './pages/LandingPage';
import StudentAuthPage from './pages/StudentAuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useConvexAuth } from '@convex-dev/auth/react';

function getRoute(): string {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function App() {
  const [route, setRoute] = useState(getRoute());
  const authState = useConvexAuth();
  const currentUser = useQuery(anyApi.viewer.currentUser);

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
  };

  const resolvedRoute = route === '' ? '/' : route;

  if (resolvedRoute === '/admin') {
    if (authState.isLoading) {
      return <div className="app-shell">Loading admin...</div>;
    }
    if (authState.isAuthenticated && currentUser?.role === 'admin') {
      return <AdminDashboard navigate={navigate} currentUser={currentUser} />;
    }
    return <AdminLoginPage navigate={navigate} />;
  }

  if (resolvedRoute.startsWith('/student')) {
    if (authState.isLoading) {
      return <div className="app-shell">Loading student portal...</div>;
    }
    if (authState.isAuthenticated && currentUser?.role === 'student') {
      return <StudentDashboard navigate={navigate} currentUser={currentUser} />;
    }
    return <StudentAuthPage navigate={navigate} />;
  }

  return <LandingPage navigate={navigate} />;
}

export default App;
