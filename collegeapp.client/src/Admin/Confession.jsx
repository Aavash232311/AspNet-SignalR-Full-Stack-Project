import { Component } from "react";
import { Admin } from "./Admin.jsx";
import { Toolbar, Typography } from '@mui/material';

export default class AdminConfession extends Component {
    render() {
        return (
            <Admin>
                <Toolbar />
                <Typography variant="h4">Hello world</Typography>
                <p>Admin confession control.</p>
            </Admin>
        )
    }
}