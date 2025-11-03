import React, { createContext, useContext, useEffect } from "react";
import NotFound from "../components/Auth/useable/404";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(undefined);

export const useAuth = () => useContext(AuthContext);

export const ROLES = {
    ADMIN: 'Superuser',
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: [ROLES.ADMIN],
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
    // allowedRoles the roles which are allowed to vew the wrapped up content,

    const token = localStorage.getItem('access_token'); // or wherever you store it

    if (!token) {
        return <NotFound />;
    }
    const decoded = jwtDecode(token);
    const getRoles = decoded["roles/roles"];

    // we require we need to have atleast one role to grand access
    const check = getRoles.some((r) => r.includes(allowedRoles));
    if (check) {
        return <>{children}</>
    }
    return <NotFound />;
};


export const AuthProvider = ({ children }) => {
    const domain = "dev-3gfo42id.us.auth0.com";
    const clientId = "iauvQygsniC9PMR9MbtICPc1vg9Cy1QW";
    const [loggedIn, setLoggedIn] = React.useState(undefined);
    const [user, setUser] = React.useState(null);
    const [roles, setRoles] = React.useState([]);

    /* we don't need to worry much about signup since all public credentials are passed to thrid party api */
    const signup = async (name, email, password, conformPassword) => {
        if (password !== conformPassword) return { error: "Two password field didn't matched" };

        const signupResponse = await fetch(`https://${domain}/dbconnections/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                email,
                password,
                connection: "Username-Password-Authentication",
                user_metadata: {
                    name,
                },
            }),
        });
        if (!signupResponse.ok) {
            const errorData = await signupResponse.json();
            return errorData;
        }
        return true;
    }
    /* backend fetches login request for us */
    const login = async (email, password) => {
        const result = await fetch(`/auth/login?email=${email}&password=${password}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }).then((r) => r.json()).then((response) => {
            const { status } = response;
            console.log(response);
            //login ma error xa hai. when password is correct
            if (status === 200) {
                /* Store the id token provied by the server, perfectly fine because id_token just
                gives user information, its not used for accessing any sort of apis, simply we can
                add that to local storage, even for access token, why? cause we are using third party login for google,
                and it would be difficult implementating it from backend since backend assigns http only cookie */
                const { data } = response;

                const { id_token, access_token, refresh_token } = data;
                localStorage.setItem("id_token", id_token);
                localStorage.setItem("access_token", access_token);
                localStorage.setItem("refresh_token", refresh_token);
                setLoggedIn(true);
                return true;
            }
            setLoggedIn(false);
            return false;
        });
        return result;
    }
    /* check's if the user is authenticated from auth0 server */
    const isUserAuthenticated = async () => {
        /* case I, not access token */
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            return { error: "Not logged in", isAuthenticated: false };
        }
        try {
            const response = await fetch("https://dev-3gfo42id.us.auth0.com/userinfo", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Invalid token or user not authenticated");
            }

            const userData = await response.json();
            return { userData, isAuthenticated: true };
        } catch (err) {
            return { error: err.message, isAuthenticated: false };
        }
    }
    const logout = () => {
        localStorage.removeItem("id_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setLoggedIn(false);
        window.location.href = "/";
    }
    useEffect(() => {
        isUserAuthenticated().then((r) => {
            setLoggedIn(r.isAuthenticated); // its like waterfall if we write logic under this promise because the execution of a function below depends upon the expecution of the function above
        });
        refreshTokenFetch();
        // if autheticated let's decode JWT for roles
        const token = localStorage.getItem('access_token');
        const decoded = jwtDecode(token);
        const getRoles = decoded["roles/roles"];
        setRoles(getRoles);
    }, []);

    const refreshTokenFetch = () => {

    }

    const methods = {
        signup,
        login,
        loggedIn,
        isUserAuthenticated,
        user,
        logout,
        roles
    };
    /* Refresh token logic auth0, we need to refrresh our access token based on the refresh token */

    return (
        <AuthContext.Provider value={methods}>{children}</AuthContext.Provider>
    )
};

export default AuthContext;