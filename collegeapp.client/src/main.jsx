import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth0ProviderWithHistory from './auth/auth0-provider-with-history.jsx';
import { AuthProvider } from './auth/auth.jsx';
import App from './App.jsx';
import SignIn from './components/Auth/Signin.jsx';
import SignUp from './components/Auth/Signup.jsx';
import Dashboard from './Dashboard.jsx';
import Confessions from './AddConfession.jsx';
import 'bootstrap/dist/css/bootstrap.css';
import View from './components/Auth/View.jsx';
import { ProtectedRoute } from './auth/auth.jsx';
import { ROLES } from './auth/auth.jsx';
import NotFound from './components/Auth/useable/404.jsx';
import AdminMessage from './Admin/Admin.jsx';
import AdminConfession from './Admin/Confession.jsx';
import Thread from './Admin/Thread.jsx';
import { AdminProvider } from './Admin/Admin.jsx';
import ReportsAdmin from './Admin/Reports.jsx';
import Notification from './components/Auth/Notification.jsx';

createRoot(document.getElementById('root')).render(
  <AdminProvider>
    <AuthProvider>
      <BrowserRouter>
        <Auth0ProviderWithHistory>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-confession" element={<Confessions />} />
            <Route path="/view" element={<View />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/admin-reports" element={<ReportsAdmin />} />
            <Route path='/notification' element={<Notification />}></Route>

            <Route path="/su-route-root" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminMessage />
              </ProtectedRoute>
            } />

            <Route path="/su-route-root/confession" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminConfession />
              </ProtectedRoute>
            } />


            <Route path="/su-route-root/theads" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Thread />
              </ProtectedRoute>
            } />

          </Routes>
        </Auth0ProviderWithHistory>
      </BrowserRouter>
    </AuthProvider>
  </AdminProvider>
);

