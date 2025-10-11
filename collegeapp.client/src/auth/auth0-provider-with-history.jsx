import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

// https://developer.auth0.com/resources/labs/authentication/google-social-connection-to-login#introduction

const Auth0ProviderWithHistory = ({ children }) => {
  const domain = "dev-3gfo42id.us.auth0.com";
  const clientId = "iauvQygsniC9PMR9MbtICPc1vg9Cy1QW";
  const navigate = useNavigate();
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      onRedirectCallback={navigate}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
