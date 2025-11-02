import React from 'react';
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import "../../../static/auth/useable/not_found.css";

const NotFound = () => {
    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <h1>404</h1>
                <h2>Oops! Page Not Found</h2>
                <p>The page you are looking for doesn’t exist or has been moved.</p>

                <NavItem style={{ listStyle: "none" }}>
                    <NavLink
                        tag={Link}
                        to={"/"}
                    >
                        <div className="home-link">
                            Go Back Home
                        </div>
                    </NavLink>
                </NavItem>
            </div>
        </div>
    );
};

export default NotFound;
