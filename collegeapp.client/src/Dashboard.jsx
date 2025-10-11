import React, { Component } from 'react';
import "./static/auth/dashboard.css";
import "./static/auth/dashboard_nav.css";
import { IoFilter } from "react-icons/io5";
import { FaRegBell } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import Services from './utils/utils';
import CustomPagination from './components/Auth/useable/Pagination';
import { MdModeEdit } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import AuthContext from './auth/auth';
import { CiHeart } from "react-icons/ci";

export class DashboardNav extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const navContent = [
            {
                label: "Confessions",
                link: "/dashboard"
            },
            {
                label: "Notification",
                link: "/"
            },
            {
                label: "Favourite",
                link: "/"
            },
            {
                label: "Profile",
                link: "/"
            },
        ]
        return (
            <>
                <div id="dashboard-nav-grid">
                    <div id="dashboard-side-nav">
                        <div id="side-nav-profile-cart">
                            <div id="profile-circle">
                                A
                            </div>
                            <div id="username-greetings">
                                <div>
                                    <b>
                                        <small>
                                            Aavash Lamichhane
                                        </small>
                                    </b>
                                </div>
                                <div>
                                    <GiHamburgerMenu />
                                </div>
                            </div>
                        </div>
                        <div>
                            <center>
                                {navContent.map((i, j) => {
                                    return (
                                        <React.Fragment key={j}>
                                            <NavItem style={{ listStyle: "none" }}>
                                                <NavLink
                                                    tag={Link}
                                                    to={i.link}
                                                >
                                                    <div className="dashboard-nav-link-frame">
                                                        {i.label}
                                                    </div>
                                                </NavLink>
                                            </NavItem>
                                        </React.Fragment>
                                    )
                                })}
                            </center>
                        </div>
                    </div>
                    <div id="dashboard-content">
                        {this.props.children}
                    </div>
                </div>
            </>
        )
    }
}


export default class Dashboard extends Component {
    constructor(props) {
        super(props);
    }
    services = new Services();

    state = {
        totalConfession: 1,
        totalPages: 1,
        confessions: null,
        currentPage: 1
    }

    getConfession(page) {
        fetch(`Confession/YourConfession?page=${page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get",
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                const { value } = response;
                const { confessions, totalPages, totalConfession } = value;
                this.setState({ confessions, totalPages, totalConfession });
            }
        });
    }

    componentDidMount() {
        this.getConfession(1);
    }
    deleteConfession(id) {
        fetch(`Confession/DeleteConfession?id=${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "delete"
        }).then(r => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                this.setState({ confessions: this.state.confessions.filter((i) => i.id !== id) }, () => {
                    if (this.state.confessions === null) {
                        this.getConfession(1);
                    }
                });
            }
        });
    }
    render() {
        const setCurrentPage = (page) => {
            this.getConfession(page);
            this.setState({ currentPage: page });
        }
        return (
            <AuthContext.Consumer>
                {(authFunctions) => {
                    return (
                        <DashboardNav>
                            <center>
                                <div id="dashboard-nav">
                                    <div id='dashboard-search-and-filter-frame'>
                                        <div>
                                            <input placeholder='Search' type="text" id="search-confession" />
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <IoFilter style={{ fontSize: "24px" }} />
                                        </div>
                                    </div>

                                    <div id="confession-right-nav-items">
                                        <div>
                                            <FaRegBell style={{ fontSize: "24px" }} />
                                        </div>
                                        <div>
                                            <button onClick={() => { authFunctions.logout() }} className='btn btn-dark'>Logout</button>
                                        </div>
                                    </div>
                                </div>
                            </center>
                            <center>
                                <div id="confession-content">
                                    <center>
                                        <div id="confession-content-align">
                                            <br />
                                            <div id="confession-page-label">
                                                <div>
                                                    <b style={{ fontSize: "20px" }}>
                                                        Your confession
                                                    </b> <br />
                                                    <span id="site-slogan">
                                                        A safe space to share, heal, and be heard — anonymously.
                                                    </span>
                                                </div>
                                                <React.Fragment>
                                                    <NavItem style={{ listStyle: "none" }}>
                                                        <NavLink
                                                            tag={Link}
                                                            to={"/add-confession"}
                                                        >
                                                            <div id="add-confession-button">
                                                                Add confession
                                                            </div>
                                                        </NavLink>
                                                    </NavItem>
                                                </React.Fragment>
                                            </div>
                                            {this.state.confessions !== null && (
                                                <>
                                                    <br />
                                                    <div>
                                                        {this.state.confessions.map((i, j) => {
                                                            return (
                                                                <React.Fragment key={j}>
                                                                    <NavItem style={{ listStyle: "none" }}>
                                                                        <NavLink
                                                                            tag={Link}
                                                                            to={`/view?topic=${i.id}`}
                                                                            style={{ marginTop: "-8px" }}
                                                                        >
                                                                            <div className='confession-cards'>
                                                                                <div className='confession-card-content'>
                                                                                    <div>
                                                                                        <h6>{i.topic}</h6>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div>
                                                                                            <div className='confession-des'>
                                                                                                {this.services.substring(i.description, 90)}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className='desctiption-and-rest-items'>
                                                                                        <MdModeEdit onClick={() => {
                                                                                            window.location.href = `/add-confession?token=${i.id}`;
                                                                                        }} />
                                                                                        <MdDeleteOutline onClick={() => { this.deleteConfession(i.id) }} />
                                                                                        <CiHeart style={{ color: "red" }} />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </NavLink>
                                                                    </NavItem>
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </div>
                                                    {this.state.totalPages > 1 ? <CustomPagination renderUpTo={10} getCurrentPage={this.state.currentPage} setCurrentPage={setCurrentPage} page={this.state.totalPages} /> : null}
                                                </>
                                            )}
                                        </div>
                                    </center>
                                </div>
                            </center>
                        </DashboardNav>
                    )
                }}
            </AuthContext.Consumer>
        )
    }
}