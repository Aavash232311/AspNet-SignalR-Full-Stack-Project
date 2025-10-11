import React, { Component } from 'react';
import "../../static/auth/signin.css";
import { GoogleIcon, FacebookIcon } from './CusomIcons/Icons';
import { NavItem, NavLink } from "reactstrap";
import AuthContext from '../../auth/auth';
import { BasicError } from './useable/ErrorRender';
import { Link } from "react-router-dom";


export default class SignIn extends Component {
    constructor(props) {
        super(props);
    }
    state = {
        errors: []
    }

    render() {
        return (
            <>
                <AuthContext.Consumer>
                    {(loginMethod) => {

                        const loginForm = (ev) => {
                            ev.preventDefault();
                            const data = new FormData(ev.target);
                            const res = loginMethod.login(data.get("email"), data.get("password"));
                            res.then((r) => {
                                if (!r) {
                                    this.setState({errors: [{value: "username or password incorrect"}]});
                                    return;
                                }
                                window.location.href = "/";
                            });
                        }
                        return (
                            <>
                                <div id='signin-page'>
                                    <center>
                                        <form onSubmit={loginForm} id='signin-frame'>
                                            <center>
                                                <h2>Sign in</h2>
                                            </center> <br />
                                            <div className="form-group">
                                                <label htmlFor="email" className='left-email-align'>Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    aria-describedby="emailHelp"
                                                    placeholder="example@emai.com"
                                                    name='email'
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="password" className='left-email-align'>Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    id="password"
                                                    aria-describedby="passwordHelp"
                                                    placeholder="password"
                                                    name='password'
                                                    required
                                                />
                                            </div>

                                            <div className="form-check-signup">
                                                <input type="checkbox" style={{ width: "12px", height: "12px" }} id="checkbox" />
                                                <label className="form-check-label" htmlFor="checkbox">
                                                    Remember me
                                                </label>
                                            </div>
                                            {this.state.errors.length > 0 ? <BasicError errors={this.state.errors} /> : null}
                                            <button >Sign in</button>

                                            <center>
                                                <a href="">Forgot password?</a>
                                            </center>

                                            <button className='centered-icon'>
                                                <div className='right-stick'>
                                                    <GoogleIcon />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    Sign in with google
                                                </div>
                                            </button>
                                            <button className='centered-icon'>
                                                <div className='right-stick'>
                                                    <FacebookIcon />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    Sign in with facebook
                                                </div>
                                            </button>
                                            <NavItem style={{ listStyle: "none" }}>
                                                <NavLink
                                                    tag={Link}
                                                    to={"/signup"}
                                                >
                                                    <center>
                                                        <span>Already have an account? Signup</span>
                                                    </center>
                                                </NavLink>
                                            </NavItem>
                                        </form>
                                    </center>
                                </div>
                            </>
                        )
                    }}
                </AuthContext.Consumer>
            </>
        )
    }
}