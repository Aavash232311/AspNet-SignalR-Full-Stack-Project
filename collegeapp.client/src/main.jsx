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

createRoot(document.getElementById('root')).render(
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
        </Routes>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  </AuthProvider>,
);

