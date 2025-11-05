import React, { Component, createContext, useContext } from "react";
import "../static/auth/Admin/admin.css";
import { CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, Collapse } from '@mui/material';
import { Brightness4, Brightness7, Settings, ListAlt, History } from '@mui/icons-material';
import WebIcon from '@mui/icons-material/Web';
import { jwtDecode } from "jwt-decode";
import { NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import TryIcon from '@mui/icons-material/Try';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';


export const AdminContext = createContext();
const useAdmin = () => useContext(AdminContext);


export const AdminProvider = ({ children }) => {
    // Although we make it rely on broswer storage, to make the componenet render accordingly triggering state here
    const [dark, setDark] = React.useState(false);
    const methods = {
        dark,
        setDark
    }
    return (
        <AdminContext.Provider value={methods}>{children}</AdminContext.Provider>
    )
}

export class Admin extends Component {
    state = {
        drawerOpen: true,
        openConfessions: false,
        openSettings: false,
    };
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        let getTheme = localStorage.getItem('theme-dark')
        if (getTheme !== undefined) { // setting the default theme
            getTheme = JSON.parse(getTheme);
            this.setState({ darkMode: getTheme })
        }
    }

    toggleConfessions = () => {
        this.setState((prevState) => ({ openConfessions: !prevState.openConfessions }));
    };
    toggleSettings = () => {
        this.setState((prevState) => ({ openSettings: !prevState.openSettings }));
    };

    toggleMenu = () => {
        this.setState({ drawerOpen: !this.state.drawerOpen });
    };

    static contextType = AdminContext;

    render() {
        const { openConfessions, openSettings } = this.state;
        return (
            <AdminProvider>
                <AdminContext.Consumer>
                    {(adminProperties) => {

                        // this dark theme cannot work from context because we have,
                        // called a differnent URL inorder to fix and make it a global we need to make use of local storage
                        const { dark, setDark } = adminProperties;
                        let darkMode = dark;
                        return (
                            <div className={darkMode ? 'admin dark' : 'admin light'}>
                                <CssBaseline />

                                {/* AppBar */}
                                <AppBar position="fixed" className="admin-appbar">
                                    <Toolbar>

                                        <Typography variant="h6" style={{ flexGrow: 1 }}>
                                            Admin Panel
                                        </Typography>

                                        <IconButton color="inherit" onClick={this.toggleMenu} >
                                            <MenuIcon />
                                        </IconButton>

                                        <IconButton color="inherit" onClick={() => {
                                            let bool = true; // stay positive :)
                                            if (darkMode === true) {
                                                setDark(false);
                                                localStorage.setItem("theme-dark", JSON.stringify(false));
                                            } else {
                                                setDark(true);
                                                localStorage.setItem("theme-dark", JSON.stringify(true)); // just to scare people 😋
                                            }
                                        }}>
                                            {darkMode ? <Brightness7 /> : <Brightness4 />}
                                        </IconButton>
                                    </Toolbar>
                                </AppBar>

                                {/* Side Drawer, instead of closing that it's not render it */}
                                {this.state.drawerOpen && (
                                    <>
                                        <Drawer
                                            variant="permanent"
                                            className="admin-drawer"
                                        >
                                            <Toolbar />
                                            <List>
                                                {/* Dropdown Trigger */}
                                                <ListItem button="true" onClick={this.toggleConfessions}>
                                                    <ListItemIcon>
                                                        <ListAlt />
                                                    </ListItemIcon>
                                                    <ListItemText primary="See Confessions" />
                                                    {openConfessions ? <ExpandLess /> : <ExpandMore />}
                                                </ListItem>

                                                {/* Dropdown Content */}
                                                <Collapse in={openConfessions} timeout="auto" unmountOnExit>
                                                    <List component="div" disablePadding>
                                                        <ListItem button="true" sx={{ pl: 4 }}>
                                                            <ListItemIcon><ShowChartIcon /></ListItemIcon>
                                                            <ListItemText primary="Analytics" />
                                                        </ListItem>
                                                        <NavLink
                                                            tag={Link}
                                                            to={"/su-route-root/confession"}
                                                        >
                                                            <ListItem button="true" sx={{ pl: 4 }}>
                                                                <ListItemIcon><TryIcon /></ListItemIcon>
                                                                <ListItemText primary="Confessions" />
                                                            </ListItem>
                                                        </NavLink>
                                                        <NavLink
                                                            tag={Link}
                                                            to={"/su-route-root/theads"}
                                                        >
                                                            <ListItem button="true" sx={{ pl: 4 }}>
                                                                <ListItemIcon><ChatBubbleOutlineIcon /></ListItemIcon>
                                                                <ListItemText primary="Threads" />
                                                            </ListItem>
                                                        </NavLink>
                                                    </List>
                                                </Collapse>

                                                {/* Dropdown Trigger Settings */}
                                                <ListItem button="true" onClick={this.toggleSettings}>
                                                    <ListItemIcon><Settings /></ListItemIcon>
                                                    <ListItemText primary="Site Settings" />
                                                    {openSettings ? <ExpandLess /> : <ExpandMore />}
                                                </ListItem>

                                                {/* Dropdown Content */}
                                                <Collapse in={openSettings} timeout="auto" unmountOnExit>
                                                    <List component="div" disablePadding>
                                                        <ListItem button="true" sx={{ pl: 4 }}>
                                                            <ListItemIcon><Settings /></ListItemIcon>
                                                            <ListItemText primary="Settings" />
                                                        </ListItem>
                                                    </List>
                                                </Collapse>


                                                <ListItem>
                                                    <ListItemIcon><History /></ListItemIcon>
                                                    <ListItemText primary="Site Logs" />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemIcon><WebIcon /></ListItemIcon>
                                                    <NavLink
                                                        tag={Link}
                                                        to={"/"}
                                                    >
                                                        <ListItemText primary="Site visit" />
                                                    </NavLink>
                                                </ListItem>
                                            </List>
                                        </Drawer>
                                    </>
                                )}

                                {/* Main Content */}
                                <main className={`admin-content ${!this.state.drawerOpen ? 'drawer-closed' : ''}`}>
                                    {this.props.children}
                                </main>
                            </div>
                        )
                    }}
                </AdminContext.Consumer>
            </AdminProvider>
        );
    }
}

export default class AdminMessage extends Component {

    componentDidMount = () => {
        const token = localStorage.getItem('id_token'); // or wherever you store it

        if (!token) {
            window.location.href = "/not-found";
            return;
        }
        const decoded = jwtDecode(token);
        const { nickname } = decoded;

        const currentHour = new Date().getHours();

        let greeting;
        if (currentHour >= 5 && currentHour < 12) {
            greeting = "Good morning";
        } else if (currentHour >= 12 && currentHour < 17) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }
        greeting = `${greeting} ${nickname}`;
        this.setState({ greeting });
    }

    state = {
        greeting: "",
    }
    render() {
        return (
            <>
                <Admin>
                    <Toolbar />
                    <Typography variant="h4">{this.state.greeting}</Typography>
                    <p>Here you can manage site settings, view confessions, and check logs.</p>
                </Admin>
            </>
        )
    }
}