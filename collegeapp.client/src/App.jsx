import React, { Component } from "react";
import "./static/auth/App.css";
import "./static/auth/Assert/assert.css";
import NavBarDefault from "./components/Auth/useable/DefaultNav";
import themeImage from "../src/assets/theme_image.jpg";
import { NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";

class App extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <>
                <NavBarDefault>
                    <div style={{ backgroundImage: `url('${themeImage}')` }} id="theme-image-div">
                        <div id="default-centered-div">
                            <br />
                            <center>
                                <h1>Health focused confession</h1>
                                <br />
                                <h6>A safe space to share, heal, and be heard — anonymously.</h6>
                                <br />

                                <NavItem style={{ listStyle: "none" }}>
                                    <NavLink
                                        tag={Link}
                                        to={"/dashboard"}
                                    >
                                        <button className="button-87">
                                            Get Started
                                        </button>
                                    </NavLink>
                                </NavItem>
                                <hr style={{ visibility: "hidden" }} />
                            </center>
                        </div>
                    </div>
                </NavBarDefault>
            </>
        );
    }
}

export default App;
