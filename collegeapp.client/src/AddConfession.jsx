import React, { Component } from 'react';
import { NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import SideNavPost from './components/Auth/useable/SideNavPost';
import "./static/auth/add-confession.css";
import Services from './utils/utils';
import { IoChevronBackOutline } from "react-icons/io5";
import AuthContext from './auth/auth';

export default class Confessions extends Component {
    constructor(props) {
        super(props);
        this.urlParams = new URLSearchParams(window.location.search);
        this.editToken = this.urlParams.get("token");
    }

    services = new Services();
    
    state = {
        notification: null,
        editConfession: null,
        isLoading: false
    }

    componentDidMount() {
        if (this.editToken !== null) {
            this.getConfession(this.editToken);
        }
    }

    showToast = (msg, type = 'success') => {
        this.setState({ notification: { msg, type } });
        setTimeout(() => this.setState({ notification: null }), 3500);
    }

    getConfession(id) {
        fetch(`Confession/GetCurrentConfession?id=${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get",
        }).then((r) => r.json()).then((response) => {
            if (response.statusCode === 200) {
                this.setState({ editConfession: response.value });
            }
        });
    }

    handleSubmit = (ev) => {
        ev.preventDefault();
        this.setState({ isLoading: true });
        const formData = new FormData(ev.target);
        
        const endpoint = this.editToken !== null 
            ? `Confession/EditConfession?editUserId=${this.editToken}` 
            : "Confession/AddConfession";
        
        const method = this.editToken !== null ? "PUT" : "POST";

        fetch(endpoint, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: method,
            body: JSON.stringify({
                Topic: formData.get("Topic"),
                Description: formData.get("Description")
            }),
        }).then((r) => r.json()).then((response) => {
            this.setState({ isLoading: false });
            if (response.statusCode === 200) {
                if(this.editToken === null) ev.target.reset();
                this.showToast(this.editToken !== null ? "Changes saved!" : "Confession shared anonymously!");
            } else {
                this.showToast("Something went wrong.", "error");
            }
        });
    }

    render() {
        return (
            <AuthContext.Consumer>
                {(auth) => {
                    const { dark } = auth;
                    const { notification, editConfession, isLoading } = this.state;

                    return (
                        <SideNavPost>
                            {/* Modern Toast */}
                            {notification && (
                                <div className={`toast-notice ${notification.type === 'error' ? 'bg-danger' : ''}`}>
                                    {notification.msg}
                                </div>
                            )}

                            <div className={`add-confession-page ${dark ? 'dark-theme' : 'light-theme'}`}>
                                <div className="confession-form-card">
                                    <header className="form-header">
                                        <h2>{this.editToken ? "Edit Confession" : "New Confession"}</h2>
                                        <Link to="/dashboard" className="back-link">
                                            <IoChevronBackOutline size={24} />
                                        </Link>
                                    </header>

                                    <form onSubmit={this.handleSubmit}>
                                        <div className="input-group">
                                            <label className="input-label">Topic</label>
                                            <input 
                                                name="Topic"
                                                defaultValue={editConfession?.topic || ""}
                                                className="form-input"
                                                placeholder="e.g. Late Night Thoughts"
                                                autoComplete='off'
                                                required
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label className="input-label">Your Secret</label>
                                            <textarea 
                                                name="Description"
                                                defaultValue={editConfession?.description || ""}
                                                className="form-input"
                                                placeholder="What's on your mind?"
                                                autoComplete='off'
                                                required
                                            />
                                        </div>

                                        <button type="submit" className="btn-submit" disabled={isLoading}>
                                            {isLoading ? "Processing..." : (this.editToken ? "Update Confession" : "Post Anonymously")}
                                        </button>
                                    </form>

                                    <div className="info-note">
                                        <strong>Safe Space:</strong> This is encrypted and anonymous. No names, no judgment, just expression.
                                    </div>
                                </div>
                            </div>
                        </SideNavPost>
                    );
                }}
            </AuthContext.Consumer>
        );
    }
}