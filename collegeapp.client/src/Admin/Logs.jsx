import { Component } from 'react';
import { Admin } from './Admin';
import Services from '../utils/utils';
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

export default class AdminLogs extends Component {
    services = new Services();

    constructor(props) {
        super(props);
        this.getLogs = this.getLogs.bind(this);
        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
        this.handleDeleteCancel = this.handleDeleteCancel.bind(this);
    }

    state = {
        logs: [],
        page: 1,
        totalCount: 0,
        openDeleteDialog: false,
        selectedLogId: null
    }

    getLogs(page, rowsPerPage) {
        fetch(`Admin/get-admin-logs?page=${page}`, {
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
                        logs: value.data,
                        totalCount: value.totalPages,
                        totalObjects: value.totalObjects
                    });
                }
            })
            .catch((error) => {
                console.error('Error fetching logs:', error);
            });
    }

    handleChangePage(event, newPage) {
        this.setState({ page: newPage }, () => {
            this.getLogs(newPage + 1, this.state.rowsPerPage);
        });
    }

    handleChangeRowsPerPage(event) {
        const newRowsPerPage = parseInt(event.target.value, 10);
        this.setState({
            rowsPerPage: newRowsPerPage,
            page: 0
        }, () => {
            this.getLogs(1, newRowsPerPage);
        });
    }

    handleDeleteClick(logId) {
        this.setState({
            openDeleteDialog: true,
            selectedLogId: logId
        });
    }

    handleDeleteConfirm() {
        // Add your delete API call here
        const { selectedLogId } = this.state;
        console.log('Deleting log:', selectedLogId);
        
        // Close dialog
        this.setState({
            openDeleteDialog: false,
            selectedLogId: null
        });
    }

    handleDeleteCancel() {
        this.setState({
            openDeleteDialog: false,
            selectedLogId: null
        });
    }

    componentDidMount() {
        this.getLogs(1, this.state.rowsPerPage);
    }

    getActionTypeColor(actionType) {
        const colors = {
            'CREATE': 'success',
            'UPDATE': 'info',
            'DELETE': 'error',
            'LOGIN': 'primary',
            'LOGOUT': 'default',
            'VIEW': 'warning'
        };
        return colors[actionType.toUpperCase()] || 'default';
    }

    render() {
        const { logs, page, totalCount, totalObjects, openDeleteDialog } = this.state;

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
                                <Typography variant="h4" gutterBottom>
                                    Admin Activity Logs
                                </Typography>

                                <TableContainer component={Paper} sx={{ mt: 3 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell><strong>User ID</strong></TableCell>
                                                <TableCell><strong>Action Type</strong></TableCell>
                                                <TableCell><strong>Remarks</strong></TableCell>
                                                <TableCell><strong>Timestamp</strong></TableCell>
                                                <TableCell><strong>Delete</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {logs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center">
                                                        <Typography variant="body1" color="textSecondary">
                                                            No logs found
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                logs.map((log) => (
                                                    <TableRow
                                                        key={log.id}
                                                        sx={{ '&:hover': { backgroundColor: '#fafafa' } }}
                                                    >
                                                        <TableCell>{log.userId}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={log.actionType}
                                                                color={this.getActionTypeColor(log.actionType)}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{log.remarks}</TableCell>
                                                        <TableCell>
                                                            {this.services.normalizeASPDate(log.timeStampAt)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <button 
                                                                className='btn btn-outline-danger btn-sm'
                                                                onClick={() => this.handleDeleteClick(log.id)}
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
                            </Box>
                            <Pagination
                                count={this.state.totalPages}
                                page={this.state.page}
                                color="primary"
                                onChange={this.handleChange}
                                sx={dark === true ? darkPagination : {}}
                            />

                            {/* Delete Confirmation Dialog */}
                            <Dialog
                                open={openDeleteDialog}
                                onClose={this.handleDeleteCancel}
                            >
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete this log?
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
                        </Admin>
                    )
                }}
            </AdminContext.Consumer>
        );
    }
}