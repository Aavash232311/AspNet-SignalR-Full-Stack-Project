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
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteApp from '../components/Auth/useable/Prompt';

const services = new Services();

class ReportsAdmin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: [],
            page: 1,
            totalPages: 1,
            isLoading: false,
            userInfo: null,
            viewReport: null,
            deletePrompt: null
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

    viewReport = async (report) => {
        // here, if the report is about confession then we simply re-direct them to the confession page
        // if the report is about commment then we render them

        if (!(services.checkEmptyGuid(report.confession))) {
            window.open(`view?topic=${report.parentConfessionId}`, "_blank");
            return;
        }

        // else if it's not about confession itself but, the report of one of it's comments then
        try {
            const response = await fetch(`/Confession/get-comment?id=${report.comments}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (result.statusCode === 200) {
                this.setState({
                    viewReport: result.value
                });
            } else {
                console.error("Error:", result.value?.message || "Comment not found");
                return null;
            }
        } catch (error) {
            console.error("Fetch failed:", error);
            return null;
        }
    }

    closeReport = () => {
        this.setState({ viewReport: null });
    }

    render() {
        const { reports, page, totalPages, isLoading } = this.state;

        const handleDialogueDel = (status) => {
            if (!(status)) {
                this.setState({ deletePrompt: null });
                return;
            }
            deleteCommentAsAdmin();
        }

        const deleteCommentAsAdmin = () => {
            // fetch(`/Admin/get-comment?id=${}`)
            const reportLog = this.state.deletePrompt;

            // let's check for what the report is really about

            var reportId;
            var type;

            if (services.checkEmptyGuid(reportLog.comments)) {
                // if comment has a empty guid then it's about confession
                reportId = reportLog.confession;
                type = "confession";
            } else {
                reportId = reportLog.comments;
                type = "comment"
            }
            deleteItem(type, reportId);
        }

        const deleteItem = (type, id) => {
            // Assuming "Admin" is the base controller route as you mentioned
            const url = `/Admin/delete-comment-conf?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;

            fetch(url, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${services.accessToken()}`,
                },
            }).then((r) => r.json()).then((res) => {
                const { statusCode } = res;
                if (!(statusCode === 200)) {
                    alert("Something wen't wrong!");
                }
                this.setState({deletePrompt: null});
            }).catch(error => {
                console.error("Error deleting item:", error);
                alert("Failed to delete item.");
                this.setState({deletePrompt: null});
            });
        }

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

                    {this.state.viewReport !== null ? <ViewDepthCommentReply content={this.state.viewReport} close={this.closeReport} /> : null}
                    {this.state.deletePrompt !== null && <DeleteApp output={handleDialogueDel} />}
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
                                            <TableCell>Delete</TableCell>
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
                                                    <div onClick={() => {
                                                        this.setState({ deletePrompt: report }, () => { });
                                                    }} className='share-option'>
                                                        <div className="share-icon-circle"> <DeleteIcon /></div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div style={{ cursor: "pointer" }} onClick={() => { this.viewReport(report) }}>
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


class ViewDepthCommentReply extends Component {
    render() {

        return (
            <>
                {/* The main blur backdrop */}
                <div className="share-comment-overlay">
                    {/* The actual share box */}
                    <div className="share-comment-modal">

                        <div className="share-modal-header">
                            <span>Share Comment</span>
                            <button onClick={() => { this.props.close() }} className="close-btn">×</button>
                        </div>

                        {/* Sample Content Preview */}
                        <div className="share-content-preview">
                            <p className="preview-body">
                                This is a sample comment that will look clear and focused while everything
                                else in the background is blurred out!
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="share-actions-grid">
                            <div className="share-option">
                                <div className="share-icon-circle">🔗</div>
                                <span>Copy Link</span>
                            </div>
                            <div onClick={() => {
                                const { content } = this.props;
                                const { confessionId } = content;
                                window.open(`view?topic=${confessionId}`, "_blank");
                            }} className="share-option">
                                <div className="share-icon-circle">💬</div>
                                <span>Full Chat</span>
                            </div>
                        </div>

                    </div>
                </div>
            </>
        )
    }
}

export default ReportsAdmin;