import React, { Component } from 'react';
import "../../static/auth/signin.css";
import { GoogleIcon, FacebookIcon } from './CustomIcons/Icons';
import AuthContext from '../../auth/auth';
import { BasicError } from './useable/ErrorRender';
import Services from '../../utils/utils';
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import { withAuth0 } from '@auth0/auth0-react';

class SignUp extends Component {
    constructor(props) {
        super(props);
        this.thirdPatryLogin = this.thirdPatryLogin.bind(this);
    }
    utils = new Services();
    state = {
        errors: []
    }

    async thirdPatryLogin(connectionName) {
        const { loginWithPopup } = this.props.auth0;
        try {
            await loginWithPopup({
                connection: connectionName,
                redirect_uri: window.location.origin,
            });
        } catch (err) {
            console.error(err);
        }
    }
    render() {
        return (
            <>
                <AuthContext.Consumer>
                    {(loginMethod) => {
                        const loginUser = async (ev) => {
                            ev.preventDefault();
                            const data = new FormData(ev.target);
                            const res = await loginMethod.signup(data.get("name"), data.get("email"), data.get("password"), data.get("conformPassword"));
                            /* we need to redirect user to login page */
                            if (res === true) window.location.href = "/signin";
                            /* for two common type of error when signin, first email might be incorrect, and the other one is password,
                            the structure might be diffrent if we have multiple errors but is not necessary for our scale. */
                            const { error } = res;
                            if (res.code === "invalid_password") {
                                console.log(res);
                                const errorList = [];
                                if (error !== undefined) {
                                    errorList.push({ value: error });
                                    this.setState({ errors: [] }, () => { this.setState({ errors: errorList }); });
                                    return;
                                }
                                const passwordRules = res.description.rules;
                                /* here for password error, we have array of int that we need to replace, log to see for more info */
                                passwordRules.map((i) => { errorList.push({ value: this.utils.formatString(i.message, i.format) }) });
                                this.setState({ errors: [] }, () => { this.setState({ errors: errorList }); });
                            } else if (res.code === "invalid_signup") {
                                // hard coding because the response from the server isn't flexible
                                const errorList = [{ value: "User already exists." }]
                                this.setState({ errors: [] }, () => { this.setState({ errors: errorList }); });
                            }
                        }
                        return (
                            <>
                                <div id='signin-page'>
                                    <center>
                                        <div style={{ marginTop: "80px" }} id='signin-frame'>
                                            <center>
                                                <h2>Sign up</h2>
                                            </center> <br />
                                            <form onSubmit={loginUser} action="">
                                                <div className="form-group">
                                                    <label htmlFor="name" className='left-email-align'>Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="name"
                                                        aria-describedby="nameHelp"
                                                        placeholder="name"
                                                        autoComplete='off'
                                                        name='name'
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="email" className='left-email-align'>Email</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="email"
                                                        aria-describedby="emailHelp"
                                                        placeholder="example@emai.com"
                                                        autoComplete='off'
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

                                                <div className="form-group">
                                                    <label htmlFor="password-conform" className='left-email-align'>Conform Password</label>
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="password-conform"
                                                        aria-describedby="passwordHelp"
                                                        placeholder="password"
                                                        name='conformPassword'
                                                        required
                                                    />
                                                </div>
                                                {this.state.errors.length > 0 ? <BasicError errors={this.state.errors} /> : null}
                                                <button>Sign up</button>
                                            </form>

                                            <button onClick={() => { this.thirdPatryLogin("google-oauth2") }} className='centered-icon'>
                                                <div className='right-stick'>
                                                    <GoogleIcon />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    Sign in with google
                                                </div>
                                            </button>
                                            <button onClick={() => { this.thirdPatryLogin("facebook") }} className='centered-icon'>
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
                                                    to={"/signin"}
                                                >
                                                    <center>
                                                        <span>Already have an account? Sign in</span>
                                                    </center>
                                                </NavLink>
                                            </NavItem>
                                        </div>
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

export default withAuth0(SignUp);