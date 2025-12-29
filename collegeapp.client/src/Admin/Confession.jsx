import React, { Component } from "react";
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
    IconButton,
    Button
} from '@mui/material';
import Services from "../utils/utils.js";
import { Auth0User } from "./Thread.jsx";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Pagination from '@mui/material/Pagination';
import { AdminContext } from "./Admin.jsx";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TextField, InputAdornment, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';

const services = new Services();

export const copyId = async (userId) => {
    try {
        await window.navigator.clipboard.writeText(userId);
        alert("Copied to clipboard");
    } catch (err) {
        console.error("Failed to copy!", err);
    }
}

export const darkMuiText = () => {
    return {
        backgroundColor: '#1e1e1e', // Background color of the input
        borderRadius: '4px',
        '& .MuiInputBase-input': {
            color: '#ffffff', // Text color
        },
        '& .MuiInputBase-input::placeholder': {
            color: '#b0b0b0', // Placeholder color
            opacity: 1,
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: '#444444', // Default border color
            },
            '&:hover fieldset': {
                borderColor: '#888888', // Hover border color
            },
            '&.Mui-focused fieldset': {
                borderColor: '#90caf9', // Focus border color (light blue)
            },
        },
    }
}

export default class AdminConfession extends Component {

    state = {
        page: 1,
        confession: [],
        totalObjects: 0,
        totalPages: 0,
        userInfo: null,
        searchQuery: ""
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

    searchById = async () => {
        await fetch(`/Admin/Search-confession-by-query?query=${this.state.searchQuery}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "GET"
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                const { value } = response; // this value is going to be a single object!
                if (!(Array.isArray(value))) {
                    this.setState({ confession: [value] });
                    return;
                }
                this.setState({
                    confession: value
                });
                return;
            }
        })
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

                                {this.state.confession.length > 0 ? (
                                    <>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
                                            <TextField
                                                size="small"
                                                placeholder="Search confessions..."
                                                value={this.state.searchQuery}

                                                onChange={(e) => {
                                                    this.setState({ searchQuery: e.target.value }, () => {
                                                        // now if the query paramms are null, re-fetch the original data
                                                        if (e.target.value === "") {
                                                            this.fetchConfessions(this.state.page);
                                                        }
                                                    });
                                                }}
                                                autoComplete="off"
                                                sx={dark === true ? darkMuiText() : {}}
                                            />
                                            <Button
                                                variant="contained"
                                                startIcon={<SearchIcon />}
                                                onClick={() => {
                                                    this.searchById();
                                                }} // Trigger your filter logic here
                                            >
                                                Search
                                            </Button>
                                        </Box>


                                        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                                            <Table sx={{ minWidth: 650 }} aria-label="confessions table">
                                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableRow>
                                                        <TableCell><strong>Topic</strong></TableCell>
                                                        <TableCell><strong>Description</strong></TableCell>
                                                        <TableCell><strong>Date Added</strong></TableCell>
                                                        <TableCell><strong>Last Modified</strong></TableCell>
                                                        <TableCell><strong>User details</strong></TableCell>
                                                        <TableCell><strong>Copy Id</strong></TableCell>
                                                        <TableCell><strong>View</strong></TableCell>
                                                        <TableCell><strong>Status</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {confession.length > 0 ? (
                                                        confession.map((item, index) => {
                                                            return (
                                                                <React.Fragment key={item.id + index}>
                                                                    <TableRow hover>
                                                                        <TableCell>{item.topic}</TableCell>
                                                                        <TableCell onClick={() => {
                                                                            window.open(`/view?topic=${item.id}`);
                                                                        }} sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                                                            <IconButton onClick={() => {
                                                                                copyId(item.id)
                                                                            }}>
                                                                                <ContentCopyIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <IconButton onClick={() => window.open(`/view?topic=${item.id}`)}>
                                                                                <LinkIcon />
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
                                                                </ React.Fragment>
                                                            )
                                                        })
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
                                        {
                                            this.state.page > 1 ? <>
                                                <Pagination
                                                    count={this.state.totalPages}
                                                    page={this.state.page}
                                                    color="primary"
                                                    onChange={this.handleChange}
                                                    sx={dark === true ? darkPagination : {}}
                                                />
                                            </> : null
                                        }
                                    </>
                                ) : null}
                            </>
                        )
                    }}
                </AdminContext.Consumer>
            </Admin >
        );
    }
}