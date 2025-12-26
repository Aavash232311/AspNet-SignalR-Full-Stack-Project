import { Component } from "react";
import { Admin } from "./Admin.jsx";
import {
    Toolbar,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton
} from '@mui/material';
import Services from "../utils/utils.js";
import { Auth0User } from "./Thread.jsx";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Pagination from '@mui/material/Pagination';
import { AdminContext } from "./Admin.jsx";

const services = new Services();

export default class AdminConfession extends Component {

    state = {
        page: 1,
        confession: [],
        totalObjects: 0,
        totalPages: 0,
        userInfo: null,
    }

    componentDidMount() {
        this.fetchConfessions(this.state.page);
    }


    fetchConfessions = (page) => {
        fetch(`/Admin/get-confession-admin?page=${page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "GET",
        })
            .then((r) => r.json())
            .then((response) => {
                const { statusCode, value } = response;
                if (statusCode === 200) {
                    const { totalObjects, totalPages, data } = value;
                    this.setState({
                        confession: data,
                        totalObjects,
                        totalPages
                    });
                }
            })
            .catch(err => console.error("Error fetching confessions:", err));
    }

    loadUser = async (userId) => {
        var res = await fetch(`/Admin/get-clientinfo?auth0Id=${userId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "GET"
        });
        var data = await res.json();
        const { value } = data;
        this.setState({ userInfo: value })
    }

    handleChange = (ev, val) => {
        this.fetchConfessions(val);
        this.setState({ page: val });
    }

    render() {
        const { confession } = this.state;
        if (this.state.userInfo !== null) {
            return (
                <Admin>
                    <div className="container-fluid py-4" style={{ marginTop: "40px" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <div>
                                <h2 className="h4 mb-0 text-primary">User Management</h2>
                                <small >Viewing details for: <strong>{this.state.userInfo.email}</strong></small>
                            </div>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => { this.setState({ userInfo: null }) }}
                            >
                                <i className="bi bi-x-lg mr-1"></i> Cancel & Back
                            </button>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <Auth0User
                                    userInfo={this.state.userInfo}
                                />
                            </div>
                        </div>
                    </div>
                </Admin>
            )
        }

        return (
            <Admin>
                <AdminContext.Consumer>
                    {(adminProperties) => {
                        const { dark } = adminProperties;
                        const darkPagination = {
                            '& .MuiPaginationItem-root': {
                                color: dark ? '#fff' : '#ffffffff',
                                borderColor: dark ? '#555' : '#ccc',
                            },
                            '& .Mui-selected': {
                                backgroundColor: dark ? '#1976d2' : '#1976d2',
                                color: '#fff',
                            },
                        }
                        return (
                            <>
                                <Toolbar />
                                <Typography variant="h4" sx={{ mb: 3 }}>
                                    Confession Management
                                </Typography>

                                <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                                    <Table sx={{ minWidth: 650 }} aria-label="confessions table">
                                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell><strong>Topic</strong></TableCell>
                                                <TableCell><strong>Description</strong></TableCell>
                                                <TableCell><strong>Date Added</strong></TableCell>
                                                <TableCell><strong>Last Modified</strong></TableCell>
                                                <TableCell><strong>User details</strong></TableCell>
                                                <TableCell><strong>Status</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {confession.length > 0 ? (
                                                confession.map((item) => (
                                                    <TableRow key={item.id} hover>
                                                        <TableCell>{item.topic}</TableCell>
                                                        <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(item.added).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(item.lastModified).toLocaleTimeString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton onClick={() => {
                                                                this.loadUser(item.userId);
                                                            }}>
                                                                <AccountCircleIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.deleted ? (
                                                                <Chip label="Deleted" color="error" size="small" />
                                                            ) : (
                                                                <Chip label="Active" color="success" size="small" />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center">
                                                        No confessions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                {this.state.page > 1 ? <>
                                    <Pagination
                                        count={this.state.totalPages}
                                        page={this.state.page}
                                        color="primary"
                                        onChange={this.handleChange}
                                        sx={dark === true ? darkPagination : {}}
                                    />
                                </> : null}
                            </>
                        )
                    }}
                </AdminContext.Consumer>
            </Admin>
        );
    }
}