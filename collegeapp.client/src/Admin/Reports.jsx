import React, { Component } from 'react';
import { Admin } from './Admin';
import {
    Toolbar, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    Pagination, Switch, Box, Chip, CircularProgress
} from '@mui/material';
import Services from '../utils/utils';
import "../static/auth/Admin/report.css";

const services = new Services();

class ReportsAdmin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: [],
            page: 1,
            totalPages: 1,
            isLoading: false
        };
    }

    componentDidMount() {
        this.getReports(this.state.page);
    }

    getReports = (page) => {
        this.setState({ isLoading: true });
        fetch(`/Admin/get-admin-report?page=${page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "GET",
        })
            .then((r) => r.json())
            .then((response) => {
                console.log(response);
                const { value } = response;
                const { data, totalPages } = value;
                this.setState({
                    reports: data || [],
                    totalPages: totalPages || 1,
                    isLoading: false
                });
            })
            .catch(err => {
                console.error("Fetch error:", err);
                this.setState({ isLoading: false });
            });
    }

    handlePageChange = (event, value) => {
        this.setState({ page: value }, () => {
            this.getReports(value);
        });
    }

    toggleVerify = (reportId, currentStatus) => {
        const newStatus = !currentStatus;

        fetch(`/Admin/verify-report/${reportId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "PATCH",
            body: JSON.stringify({ isVerified: newStatus })
        })
            .then(r => {
                if (r.ok) {
                    // Optimistically update the UI
                    this.setState(prevState => ({
                        reports: prevState.reports.map(report =>
                            report.id === reportId ? { ...report, isVerified: newStatus } : report
                        )
                    }));
                }
            });
    }

    render() {
        const { reports, page, totalPages, isLoading } = this.state;

        return (
            <Admin>
                <Toolbar />
                <Box className="admin-container">
                    <Typography variant="h4" gutterBottom>Admin Report Management</Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Review and verify reported confessions and comments.
                    </Typography>

                    <TableContainer component={Paper} className="table-container">
                        <Table aria-label="reports table">
                            <TableHead className="table-head">
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell>Reported By</TableCell>
                                    <TableCell align="center">Verified</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                                    </TableRow>
                                ) : reports.map((report) => (
                                    <TableRow key={report.id} hover>
                                        <TableCell>{new Date(report.reportedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="reason-cell">{report.reason}</TableCell>
                                        <TableCell>
                                            {report.Confession ? <Chip label="Confession" size="small" color="primary" variant="outlined" /> : null}
                                            {report.Comments ? <Chip label="Comment" size="small" color="secondary" variant="outlined" /> : null}
                                        </TableCell>
                                        <TableCell className="user-id">{report.reportedByUserId || 'Anonymous'}</TableCell>
                                        <TableCell align="center">
                                            <Switch
                                                checked={report.isVerified}
                                                onChange={() => this.toggleVerify(report.id, report.isVerified)}
                                                color="success"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Box
                    display="flex"
                    justifyContent="flex-start"
                    mt={4}
                    pb={2}
                >
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={this.handlePageChange}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            </Admin>
        );
    }
}

export default ReportsAdmin;