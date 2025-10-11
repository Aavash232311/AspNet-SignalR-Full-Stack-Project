import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import "../../../static/auth/useable/nav.css";
import AuthContext from '../../../auth/auth';

export default class NavBarDefault extends React.Component {
    constructor(props) {
        super(props);
    }
    static contextType = AuthContext;
    state = {
        isAuthenticated: false,
    }
    render() {
        return (
            <AuthContext.Consumer>
                {(authService) => {
                    let loggedIn = false;
                    if (!(authService.loggedIn === undefined)) {
                        loggedIn = authService.loggedIn;
                    }
                    return (
                        <>
                            <div id='nav-grid'>
                                <div>
                                    <Box sx={{
                                        flexGrow: 1,
                                        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                                    }}>
                                        <AppBar sx={{ background: "transparent", boxShadow: "none" }} position="static">
                                            <Toolbar>
                                                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                                    <NavItem style={{ listStyle: "none" }}>
                                                        <NavLink
                                                            tag={Link}
                                                            to={"/"}
                                                        >
                                                            Routine App
                                                        </NavLink>
                                                    </NavItem>
                                                </Typography>
                                                {loggedIn && (
                                                    <>
                                                        <NavItem style={{ listStyle: "none" }}>
                                                            <NavLink
                                                                tag={Link}
                                                                to={"/profile"}
                                                            >
                                                                <Button color="inherit">Profile</Button>
                                                            </NavLink>
                                                        </NavItem>

                                                        <NavItem style={{ listStyle: "none" }}>
                                                            <NavLink
                                                                tag={Link}
                                                                onClick={() => {authService.logout()}}
                                                            >
                                                                <Button color="inherit">Logout</Button>
                                                            </NavLink>
                                                        </NavItem>                                                        
                                                    </>
                                                )}
                                                {!loggedIn && (
                                                    <>
                                                        <NavItem style={{ listStyle: "none" }}>
                                                            <NavLink
                                                                tag={Link}
                                                                to={"/signin"}
                                                            >
                                                                <Button color="inherit">Login</Button>
                                                            </NavLink>
                                                        </NavItem>
                                                        <NavItem style={{ listStyle: "none" }}>
                                                            <NavLink
                                                                tag={Link}
                                                                to={"/signup"}
                                                            >
                                                                <Button color="inherit">Signup</Button>
                                                            </NavLink>
                                                        </NavItem>
                                                    </>
                                                )}
                                                <Button color="inherit">About us</Button>
                                            </Toolbar>
                                        </AppBar>
                                    </Box>
                                </div>
                                <div>
                                    {this.props.children}
                                </div>
                            </div>
                        </>
                    )
                }}
            </AuthContext.Consumer>
        )
    }
}
