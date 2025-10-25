import React, { Component } from 'react';
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import SideNavPost from './components/Auth/useable/SideNavPost';
import "./static/auth/add-confession.css";
import Services from './utils/utils';
import { IoChevronBackOutline } from "react-icons/io5";
import Textarea from '@mui/joy/Textarea';


export default class Confessions extends Component {
    constructor(props) {
        super(props);
        this.addConfession = this.addConfession.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.getConfession = this.getConfession.bind(this);
        this.urlParams = new URLSearchParams(window.location.search);
        this.editToken = this.urlParams.get("token");
    }
    services = new Services();
    state = {
        added: false,
        editConfession: null
    }

    getConfession(id) {
        fetch(`Confession/GetCurrentConfession?id=${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get",
        }).then((r) => r.json()).then((response) => {
            const { statusCode, value } = response;
            if (statusCode === 200) {
                this.setState({ editConfession: value });
            }
        });
    }

    componentDidMount() {
        if (this.editToken !== null) {
            /* We are using this componenet to edit */
            this.getConfession(this.editToken);
        }
    }
    addConfession(ev) {
        ev.preventDefault();
        const formData = new FormData(ev.target);
        if (this.editToken !== null) { // make call to edit api
            fetch(`Confession/EditConfession?editUserId=${this.editToken}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.services.accessToken()}`,
                },
                method: "PUT",
                body: JSON.stringify({
                    Topic: formData.get("Topic"),
                    Description: formData.get("Description")
                }),
            }).then((r) => r.json()).then((response) => {
                const { statusCode } = response;
                if (statusCode === 200) {
                    this.getConfession(this.editToken);
                    alert("Changed made!");
                }
            });
            return;
        }
        fetch("Confession/AddConfession", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "post",
            credentials: "include",
            body: JSON.stringify({
                Topic: formData.get("Topic"),
                Description: formData.get("Description")
            }),
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                ev.target.reset(); // reset form
                this.setState({ added: true }, () => {
                    setTimeout(() => {
                        this.setState({ added: false });
                    }, 2000);
                });
            }

        })
    }

    render() {
        return (
            <React.Fragment>
                <SideNavPost>
                    <center>
                        {this.state.added && (
                            <>
                                <div className="alert alert-success" role="alert">
                                    Confession added!!
                                </div>
                            </>
                        )}
                        <div id='add-confession-content'>
                            <form onSubmit={this.addConfession}>
                                <hr style={{ visibility: "hidden" }} />
                                <div className='add-confession-form-wrapper'>
                                    <div id='add-confession-label-and-back' className='confession-add-labels'>
                                        <div>
                                            <h6>Add your confessions </h6>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <NavItem style={{ listStyle: "none" }}>
                                                <NavLink
                                                    tag={Link}
                                                    to={"/dashboard"}
                                                >
                                                    <IoChevronBackOutline />
                                                </NavLink>
                                            </NavItem>
                                        </div>
                                    </div>
                                </div>

                                <div className='add-confession-form-wrapper'>
                                    <div className='confession-add-labels'>
                                        Topic
                                    </div>
                                    <div>
                                        <input defaultValue={this.state.editConfession !== null ? this.state.editConfession.topic : ""} required autoComplete='off' name='Topic' className='form-control' type="text" placeholder='topic' />
                                    </div>
                                </div>

                                <div className='add-confession-form-wrapper'>
                                    <div className='confession-add-labels'>
                                        Add Confession
                                    </div>
                                    <div>

                                        <textarea defaultValue={this.state.editConfession !== null ? this.state.editConfession.description : ""} required autoComplete='off' className='form-control' name="Description" placeholder='Confessions' id=""></textarea>
                                    </div>
                                </div>

                                <div className='add-confession-form-wrapper' id='add-new-confession-grid'>
                                    <button type='submit' className='btn btn-success submit-confession-button'>
                                        Add
                                    </button>
                                    <NavItem style={{ listStyle: "none" }}>
                                        <NavLink
                                            tag={Link}
                                            to={"/dashboard"}
                                        >
                                            <div className='btn btn-primary'>New</div>
                                        </NavLink>
                                    </NavItem>
                                </div>
                            </form>

                            <div className='add-confession-form-wrapper' id='add-confession-note'>
                                <span>
                                    This is a safe space to share what’s on your mind — anonymously and without judgment. Whether it’s something funny, deep, embarrassing, or heartfelt, feel free to express yourself.
                                    Just type it out and hit submit — no names, no pressure.
                                </span>
                            </div>
                        </div>
                    </center>
                </SideNavPost>
            </React.Fragment>
        )
    }
}