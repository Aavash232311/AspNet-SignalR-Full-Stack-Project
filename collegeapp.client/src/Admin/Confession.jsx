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
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    // Added Dialog imports for the "Are you sure" popup
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import Services from "../utils/utils.js";
import { Auth0User } from "./Thread.jsx";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Pagination from '@mui/material/Pagination';
import { AdminContext } from "./Admin.jsx";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TextField, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';

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
        searchQuery: "",
        anchorEl: null,
        selectedItem: null,
        openDeleteDialog: false // State to handle the confirmation popup
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

    handleMenuOpen = (event, item) => {
        this.setState({ anchorEl: event.currentTarget, selectedItem: item });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
        // Note: we keep selectedItem until the Dialog closes if it's open
    };

    // Opens the confirmation popup
    handleOpenDeleteDialog = () => {
        this.setState({ openDeleteDialog: true, anchorEl: null });
    }

    // Closes the confirmation popup
    handleCloseDeleteDialog = () => {
        this.setState({ openDeleteDialog: false, selectedItem: null });
    }

    deleteIconAction = () => {
        const { id } = this.state.selectedItem;
        fetch(`/Admin/delete-confession?confId=${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "DELETE"
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            console.log(response);
            if (statusCode === 200) {
                alert("Confession deleted successfully");
                this.fetchConfessions(this.state.page);
                this.handleCloseDeleteDialog(); // Close dialog after success
                return;
            }
        });
    }

    render() {
        const { confession, anchorEl, selectedItem, openDeleteDialog } = this.state;
        const open = Boolean(anchorEl);

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
                                                        <TableCell><strong>Status</strong></TableCell>
                                                        <TableCell align="center"><strong>Actions</strong></TableCell>
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
                                                                            {item.deleted ? (
                                                                                <Chip label="Deleted" color="error" size="small" />
                                                                            ) : (
                                                                                <Chip label="Active" color="success" size="small" />
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell align="center">
                                                                            <IconButton onClick={(e) => this.handleMenuOpen(e, item)}>
                                                                                <MoreVertIcon />
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </ React.Fragment>
                                                            )
                                                        })
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} align="center">
                                                                No confessions found.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        {/* action menu */}
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={this.handleMenuClose}
                                        >
                                            <MenuItem onClick={() => { this.loadUser(selectedItem.userId); this.handleMenuClose(); }}>
                                                <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>User Details</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={() => { copyId(selectedItem.id); this.handleMenuClose(); }}>
                                                <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Copy ID</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={() => { window.open(`/view?topic=${selectedItem.id}`); this.handleMenuClose(); }}>
                                                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>View</ListItemText>
                                            </MenuItem>
                                            <MenuItem sx={{ color: 'error.main' }} onClick={() => { this.handleOpenDeleteDialog(); }}>
                                                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                                                <ListItemText>Delete</ListItemText>
                                            </MenuItem>
                                        </Menu>

                                        {/* Delete Confirmation Popup */}
                                        <Dialog
                                            open={openDeleteDialog}
                                            onClose={this.handleCloseDeleteDialog}
                                            aria-labelledby="alert-dialog-title"
                                            aria-describedby="alert-dialog-description"
                                        >
                                            <DialogTitle id="alert-dialog-title">
                                                {"Confirm Deletion"}
                                            </DialogTitle>
                                            <DialogContent>
                                                <DialogContentText id="alert-dialog-description">
                                                    Are you sure you want to delete this confession? This action cannot be undone.
                                                </DialogContentText>
                                            </DialogContent>
                                            <DialogActions>
                                                <Button onClick={this.handleCloseDeleteDialog} color="primary">
                                                    Cancel
                                                </Button>
                                                <Button onClick={this.deleteIconAction} color="error" autoFocus variant="contained">
                                                    Delete
                                                </Button>
                                            </DialogActions>
                                        </Dialog>
                                        {
                                            <>
                                                <hr style={{visibility: "hidden"}} />
                                                <Pagination
                                                    count={this.state.totalPages}
                                                    page={this.state.page}
                                                    color="primary"
                                                    onChange={this.handleChange}
                                                    sx={dark === true ? darkPagination : {}}
                                                />
                                            </>
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