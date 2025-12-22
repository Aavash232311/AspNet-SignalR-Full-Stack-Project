import { Component } from 'react';
import { Admin } from './Admin';
import {
    Toolbar, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    Pagination, Switch, Box, Chip, CircularProgress
} from '@mui/material';
import Services from '../utils/utils';
import "../static/auth/Admin/report.css";
import { Auth0User } from './Thread';
import SecurityIcon from '@mui/icons-material/Security';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { NavLink } from "reactstrap";
import Link from '@mui/material/Link';

const services = new Services();

class ReportsAdmin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: [],
            page: 1,
            totalPages: 1,
            isLoading: false,
            userInfo: null
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

    toggleVerify = (report) => {
        const newStatus = report.isVerified === true ? false : true;
        fetch(`/Admin/report-verified?status=${newStatus}&reportId=${report.id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${services.accessToken()}`,
            },
            method: "post"
        })
            .then((r) => r.json()).then((res) => {
                const { statusCode } = res;
                if (!(statusCode === 200)) {
                    alert("Something wen't wrong")
                    return;
                }
                this.setState((prevState) => ({
                    reports: prevState.reports.map((item) =>
                        item.id === report.id ? { ...item, isVerified: newStatus } : item
                    ),
                }));
            })
            .catch(err => console.error("Update failed:", err));
    }

    render() {
        const { reports, page, totalPages, isLoading } = this.state;
        return (
            <Admin>
                <Toolbar />
                {this.state.userInfo != null ? (
                    <div className="admin-modal-backdrop" onClick={() => this.setState({ userInfo: null })}>
                        <Auth0User
                            userInfo={this.state.userInfo}
                            onClose={() => this.setState({ userInfo: null })}
                        />
                    </div>
                ) : null}
                <Box className="admin-container">
                    <Typography variant="h4" gutterBottom>Admin Report Management</Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Review and verify reported confessions and comments.
                    </Typography>

                    {reports.length > 0 ? (
                        <>
                            <TableContainer component={Paper} className="table-container">
                                <Table aria-label="reports table">
                                    <TableHead className="table-head">
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Reason</TableCell>
                                            <TableCell></TableCell>
                                            <TableCell>Reported By</TableCell>
                                            <TableCell>View Confession</TableCell>
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
                                                <TableCell className="user-id">
                                                    <div style={{ cursor: "pointer" }} onClick={() => {
                                                        this.loadUser(report.reportedByUserId);
                                                    }}>
                                                        View User <SecurityIcon fontSize='small' />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div style={{cursor: "pointer"}} onClick={() => {
                                                        window.open(`view?topic=${report.parentConfessionId}`, "_blank");
                                                    }}>
                                                        View <ChatBubbleOutlineIcon fontSize='small' />
                                                    </div>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        checked={report.isVerified}
                                                        onChange={() => {
                                                            // do a fetch call to make this state change to verified
                                                            this.toggleVerify(report);
                                                        }}
                                                        color="success"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : <>No reports!</>}
                </Box>

                {reports.length > 0 &&
                    <>
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
                    </>
                }
            </Admin>
        );
    }
}

export default ReportsAdmin;