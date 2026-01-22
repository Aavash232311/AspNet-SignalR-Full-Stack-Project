import React, { Component } from 'react';
import "./static/auth/dashboard.css";
import "./static/auth/dashboard_nav.css";
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import Services from './utils/utils';
import CustomPagination from './components/Auth/useable/Pagination';
import { MdModeEdit } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import AuthContext from './auth/auth';
import { CiHeart } from "react-icons/ci";
import SideNavPost from './components/Auth/useable/SideNavPost';
import Pagination from '@mui/material/Pagination';

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
                const { data, totalPages, totalObjects } = value;
                this.setState({ confessions: data, totalPages, totalConfession: totalObjects });
            }
        });
    }

    componentDidMount() {
        this.getConfession(1);
    }
    deleteConfession(id) {
        // add a confirmation dialog here, no fancy UI 
        const confirmed = window.confirm("Are you sure you want to delete this confession? Please note that all associated threads and comments will be deleted as well.");
        
        if (confirmed) {
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
                        if (this.state.confessions === null || this.state.confessions.length === 0) {
                            this.getConfession(1);
                        }
                    });
                }
            });
        }
    }
    handleChange = (ev, val) => {
        this.getConfession(val);
        this.setState({ currentPage: val });
    }
    render() {
        return (
            <AuthContext.Consumer>
                {(authFunctions) => {
                    const { dark } = authFunctions;

                    const darkPagination = {
                        '& .MuiPaginationItem-root': {
                            color: dark ? '#fff' : '#1e293b', // Dark blue text in light mode
                            borderColor: dark ? '#555' : '#ccc',
                        },
                        '& .Mui-selected': {
                            backgroundColor: '#1976d2',
                            color: '#fff',
                        },
                    };

                    return (
                        <SideNavPost>
                            {/* Dynamically toggle the theme class here */}
                            <div className={`dashboard-container ${dark ? 'dark-theme' : 'light-theme'}`}>

                                <header className="dashboard-header">
                                    <div>
                                        <span className="live-badge">Live Feed</span>
                                        <h1 className="header-title">Your Confessions</h1>
                                        <p className="header-subtitle">A safe space to share, heal, and be heard — anonymously.</p>
                                    </div>
                                    <Link to="/add-confession" className="btn-add-confession">
                                        <span>+</span> Add Confession
                                    </Link>
                                </header>

                                <div className="confession-grid">
                                    {this.state.confessions !== null && this.state.confessions.map((i, j) => (
                                        <div key={i.id || j} className="confession-card">
                                            <div className="card-content">
                                                <div className="card-tag">#{i.topic.split('#')[1] || (j + 100)}</div>
                                                <Link to={`/view?topic=${i.id}`} style={{ textDecoration: 'none' }}>
                                                    <h3 className="card-topic">{i.topic.split('#')[0]}</h3>
                                                    <p className="card-description">
                                                        "{this.services.substring(i.description, 90)}..."
                                                    </p>
                                                </Link>
                                            </div>

                                            <div className="action-row">
                                                <button className="icon-button btn-edit" onClick={() => window.location.href = `/add-confession?token=${i.id}`}>
                                                    <MdModeEdit size={20} />
                                                </button>
                                                <button className="icon-button btn-delete" onClick={() => this.deleteConfession(i.id)}>
                                                    <MdDeleteOutline size={20} />
                                                </button>
                                                <button className="icon-button btn-heart">
                                                    <CiHeart size={20} style={{ color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {this.state.totalPages > 1 && (
                                    <div className="pagination-container">
                                        <Pagination
                                            count={this.state.totalPages}
                                            page={this.state.currentPage}
                                            onChange={this.handleChange}
                                            color="primary"
                                            sx={darkPagination}
                                        />
                                    </div>
                                )}
                            </div>
                        </SideNavPost>
                    );
                }}
            </AuthContext.Consumer>
        )
    }
}