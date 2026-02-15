import { Component } from 'react';
import { Admin } from './Admin';
import Services from "../utils/utils.js";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import { AdminContext } from './Admin';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearAllIcon from '@mui/icons-material/ClearAll';

export default class PushNotification extends Component {
    services = new Services();

    constructor(props) {
        super(props);
        this.getNotifications = this.getNotifications.bind(this);
        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
        this.handleDeleteCancel = this.handleDeleteCancel.bind(this);
        this.handleClearAllClick = this.handleClearAllClick.bind(this);
        this.handleClearAllConfirm = this.handleClearAllConfirm.bind(this);
        this.handleClearAllCancel = this.handleClearAllCancel.bind(this);
    }

    state = {
        notifications: [],
        page: 1,
        totalCount: 0,
        totalObjects: 0,
        openDeleteDialog: false,
        openClearAllDialog: false,
        selectedNotificationId: null
    }

    getNotifications(page) {
        let url = `Admin/push-notification?page=${page}`;

        fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get",
        })
            .then((r) => r.json())
            .then((response) => {
                const { statusCode } = response;
                if (statusCode === 200) {
                    const { value } = response;

                    this.setState({
                        notifications: value.data,
                        totalCount: value.totalPages,
                        totalObjects: value.totalObjects
                    });
                }
            })
            .catch((error) => {
                console.error('Error fetching notifications:', error);
            });
    }

    handleChangePage(event, newPage) {
        this.setState({ page: newPage }, () => {
            this.getNotifications(newPage);
        });
    }

    handleDeleteClick(notificationId) {
        this.setState({
            openDeleteDialog: true,
            selectedNotificationId: notificationId
        });
    }

    handleDeleteConfirm() {
        const { selectedNotificationId } = this.state;

        fetch(`Admin/clear-notification?notificationId=${selectedNotificationId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "DELETE",
        })
            .then((r) => r.json())
            .then((response) => {
                if (response.statusCode === 200) {
                    // refresh the notifications after deletion
                    this.getNotifications(this.state.page);
                }
            })
            .catch((error) => {
                console.error('Error deleting notification:', error);
            });
        
        this.setState({
            openDeleteDialog: false,
            selectedNotificationId: null
        });
    }

    handleDeleteCancel() {
        this.setState({
            openDeleteDialog: false,
            selectedNotificationId: null
        });
    }

    handleClearAllClick() {
        this.setState({
            openClearAllDialog: true
        });
    }

    handleClearAllConfirm() {
        fetch(`Admin/clear-all-notification`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "DELETE",
        })
            .then((r) => r.json())
            .then((response) => {
                if (response.statusCode === 200) {
                    // Reset to page 1 and refresh
                    this.setState({ page: 1 }, () => {
                        this.getNotifications(1);
                    });
                }
            })
            .catch((error) => {
                console.error('Error clearing all notifications:', error);
            });
        
        this.setState({
            openClearAllDialog: false
        });
    }

    handleClearAllCancel() {
        this.setState({
            openClearAllDialog: false
        });
    }

    componentDidMount() {
        this.getNotifications(1);
    }

    getNotificationTypeColor(type) {
        const colors = {
            'INFO': 'info',
            'WARNING': 'warning',
            'ERROR': 'error',
            'SUCCESS': 'success',
            'ALERT': 'error'
        };
        return colors[type?.toUpperCase()] || 'default';
    }

    render() {
        const { notifications, page, totalCount, totalObjects, openDeleteDialog, openClearAllDialog } = this.state;

        return (
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
                        <Admin>
                            <Box sx={{ p: 3 }}>
                                <hr />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <NotificationsIcon sx={{ mr: 1, fontSize: 32 }} />
                                        <Typography variant="h4">
                                            Push Notifications
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<ClearAllIcon />}
                                        onClick={this.handleClearAllClick}
                                        disabled={totalObjects === 0}
                                    >
                                        Clear All Notifications
                                    </Button>
                                </Box>

                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Total Notifications: {totalObjects}
                                </Typography>

                                <TableContainer component={Paper} sx={{ mt: 3 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell><strong>ID</strong></TableCell>
                                                <TableCell><strong>Title</strong></TableCell>
                                                <TableCell><strong>Message</strong></TableCell>
                                                <TableCell><strong>Type</strong></TableCell>
                                                <TableCell><strong>Sent At</strong></TableCell>
                                                <TableCell><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {notifications.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">
                                                        <Typography variant="body1" color="textSecondary">
                                                            No notifications found
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <TableRow
                                                        key={notification.id}
                                                        sx={{ '&:hover': { backgroundColor: '#fafafa' } }}
                                                    >
                                                        <TableCell>{notification.id}</TableCell>
                                                        <TableCell>{notification.title}</TableCell>
                                                        <TableCell>{notification.message}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={notification.type || 'INFO'}
                                                                color={this.getNotificationTypeColor(notification.type)}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {this.services.normalizeASPDate(notification.sentAt)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <button 
                                                                className='btn btn-outline-danger btn-sm'
                                                                onClick={() => this.handleDeleteClick(notification.id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalCount}
                                        page={page}
                                        color="primary"
                                        onChange={this.handleChangePage}
                                        sx={dark === true ? darkPagination : {}}
                                    />
                                </Box>
                            </Box>

                            {/* Delete Single Notification Dialog */}
                            <Dialog
                                open={openDeleteDialog}
                                onClose={this.handleDeleteCancel}
                            >
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete this notification?
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleDeleteCancel} color="primary">
                                        Cancel
                                    </Button>
                                    <Button onClick={this.handleDeleteConfirm} color="error" autoFocus>
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            {/* Clear All Notifications Dialog */}
                            <Dialog
                                open={openClearAllDialog}
                                onClose={this.handleClearAllCancel}
                            >
                                <DialogTitle>Confirm Clear All</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete ALL notifications? This action cannot be undone.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleClearAllCancel} color="primary">
                                        Cancel
                                    </Button>
                                    <Button onClick={this.handleClearAllConfirm} color="error" autoFocus>
                                        Clear All
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Admin>
                    )
                }}
            </AdminContext.Consumer>
        );
    }
}