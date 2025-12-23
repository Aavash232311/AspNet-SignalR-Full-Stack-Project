import { Component } from 'react';
import { Admin } from './Admin';
import {
    Toolbar, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    Pagination, Switch, Box, Chip, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Grid2 as Grid,// for the bluer effect
    IconButton, Button
} from '@mui/material';
import Services from '../utils/utils';
import "../static/auth/Admin/report.css";
import { Auth0User } from './Thread';
import SecurityIcon from '@mui/icons-material/Security';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Chart as ChartJS, Title, Tooltip, Legend, TimeScale, LinearScale } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';

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
            frequencyReports: null,
            status: 'active',
            sortBy: 'high-low',
            fchart: null
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
                const { pagination, frequencyReports } = value;
                const { data, totalPages } = pagination;
                this.setState({
                    reports: data || [],
                    totalPages: totalPages || 1,
                    isLoading: false,
                    frequencyReports
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
                const { comment } = result.value;
                this.setState({
                    viewReport: comment
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

    closeReport = () => this.setState({ viewReport: null });
    clostFchart = () => this.setState({ fchart: null });

    // Universal handler for select inputs
    handleFilterChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value }, () => {
            // Optional: Trigger a callback or API call after state updates
            console.log(`Filter updated: ${name} = ${value}`);
        });
    };

    render() {
        const { reports, page, totalPages, isLoading } = this.state;

        const deleteItem = (reportLog, status) => {
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

            // Assuming "Admin" is the base controller route as you mentioned
            const url = `/Admin/delete-comment-conf?type=${encodeURIComponent(type)}&id=${encodeURIComponent(reportId)}&recordId=${encodeURIComponent(reportLog.id)}&status=${status}`;

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
                this.setState({ deletePrompt: null }, () => {
                    // now what we want to do is update the state acoordingly!
                    this.getReports(this.state.page);
                });
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

                {this.state.fchart === null ? null : <ReportFrequencyVisualazation info={this.state.fchart} close={this.clostFchart} />}

                <Box className="admin-container">
                    <Typography variant="h4" gutterBottom>Admin Report Management</Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Review and verify reported confessions and comments.
                    </Typography>

                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
                        <Grid container spacing={2} alignItems="center">

                            {/* Status Filter */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="status-label">Report Status</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        name="status" // Must match the state key
                                        value={this.state.status}
                                        label="Report Status"
                                        onChange={this.handleFilterChange}
                                    >
                                        <MenuItem value="active">Active Reports</MenuItem>
                                        <MenuItem value="deleted">Deleted Reports</MenuItem>
                                        <MenuItem value="deleted">All Reports</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Sort Filter */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="sort-label">Order By</InputLabel>
                                    <Select
                                        labelId="sort-label"
                                        name="sortBy" // Must match the state key
                                        value={this.state.sortBy}
                                        label="Order By"
                                        onChange={this.handleFilterChange}
                                    >
                                        <MenuItem value="high-low">f: High to Low</MenuItem>
                                        <MenuItem value="low-high">f: Low to High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                        </Grid>
                    </Box>

                    {this.state.viewReport !== null ? <ViewDepthCommentReply content={this.state.viewReport} close={this.closeReport} /> : null}
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
                                            <TableCell>f</TableCell>
                                            <TableCell>View Confession</TableCell>
                                            <TableCell align="center">Verified</TableCell>
                                        </TableRow>

                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                                            </TableRow>
                                        ) : reports.map((report) => {
                                            const f = this.state.frequencyReports.find((x) => x.refId === report.id);
                                            return (
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
                                                        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                                                            <Select
                                                                value={report.isDeleted ? "deleted" : "active"}
                                                                onChange={(e) => {
                                                                    // Only open the prompt if moving from Active to Deleted
                                                                    if (e.target.value === "active") {
                                                                        deleteItem(report, false);
                                                                    } else {
                                                                        // Logic to "undo" delete if your API supports it
                                                                        deleteItem(report, true);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontSize: '0.85rem',
                                                                    color: report.isDeleted ? 'error.main' : 'success.main',
                                                                    fontWeight: 'bold',
                                                                    '& .MuiSelect-select': { py: 1 }
                                                                }}
                                                            >
                                                                <MenuItem value="active">
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <CheckCircleIcon fontSize="small" color="success" /> Active
                                                                    </div>
                                                                </MenuItem>
                                                                <MenuItem value="deleted">
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <DeleteIcon fontSize="small" color="error" /> Deleted
                                                                    </div>
                                                                </MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell>
                                                        {this.state.frequencyReports !== null ? (
                                                            <Button
                                                                variant="outlined" // or "contained" for a solid look
                                                                size="small"
                                                                onClick={() => { this.setState({ fchart: report }) }}
                                                                sx={{
                                                                    minWidth: '40px',
                                                                    textTransform: 'none',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {f.frequency}
                                                            </Button>
                                                        ) : null}
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
                                            )
                                        })}
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

ChartJS.register(MatrixController, MatrixElement, Title, Tooltip, Legend, TimeScale, LinearScale);

class ReportFrequencyVisualazation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chartData: {
                datasets: []
            },
            loading: true
        };
    }

    processData = (rawData) => {
        const counts = {};

        // 1. Map existing data to a quick-lookup object
        rawData.forEach(item => {
            const dateStr = DateTime.fromISO(item.x).toISODate();
            counts[dateStr] = (counts[dateStr] || 0) + parseInt(item.y);
        });

        // 2. Determine the date range (e.g., Start of the year to Today)
        const end = DateTime.now();
        let start = end.minus({ years: 1 }).startOf('week');
        // Or use: let start = DateTime.fromISO("2025-01-01");

        const fullCalendarGrid = [];

        // 3. Loop through every single day and create a "Matrix" point
        while (start <= end) {
            const dateStr = start.toISODate();
            fullCalendarGrid.push({
                x: start.startOf('week').toMillis(), // Column (Week)
                y: start.weekday,                    // Row (Day of Week)
                v: counts[dateStr] || 0,             // Value (0 if no reports)
                d: dateStr                           // Formatted date for tooltip
            });
            start = start.plus({ days: 1 });
        }

        return fullCalendarGrid;
    }

    fetchData = async () => {
        try {
            const response = await fetch(`Admin/Report-logs?reportId=${this.props.info.id}`, {
                method: 'get',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${services.accessToken()}`,
                },
            });
            const data = await response.json();

            if (data.statusCode === 200) {
                const matrixData = this.processData(data.value);

                this.setState({
                    loading: false,
                    chartData: {
                        datasets: [{
                            label: 'Report Frequency',
                            data: matrixData,
                            backgroundColor: (context) => {
                                const value = context.dataset.data[context.dataIndex]?.v || 0;
                                // GitHub Color Logic
                                if (value === 0) return '#ebedf0';
                                if (value === 1) return '#9be9a8';
                                if (value <= 3) return '#40c463';
                                if (value <= 5) return '#30a14e';
                                return '#216e39';
                            },
                            borderWidth: 1,
                            borderColor: '#fff',
                            width: ({ chart }) => (chart.chartArea ? (chart.chartArea.width / 52) - 2 : 10),
                            height: ({ chart }) => (chart.chartArea ? (chart.chartArea.height / 7) - 2 : 10),
                        }]
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching report logs:", error);
        }
    }

    componentDidMount() {
        this.fetchData();
    }

    render() {
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    display: true,
                    offset: true,
                    time: { unit: 'month' },
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true }
                },
                y: {
                    type: 'linear',
                    display: true,
                    offset: true,
                    reverse: true, // Monday at the top
                    min: 0.5,
                    max: 7.5,
                    grid: { display: false },
                    ticks: {
                        stepSize: 1,
                        callback: (value) => {
                            const days = ['', 'Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
                            return days[value];
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => items[0].raw.d,
                        label: (item) => `Reports: ${item.raw.v}`
                    }
                }
            }
        };

        return (
            <div className="share-comment-overlay">
                <IconButton
                    aria-label="close"
                    onClick={this.props.close}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                        '&:hover': {
                            color: (theme) => theme.palette.error.main,
                            backgroundColor: 'rgba(211, 47, 47, 0.04)'
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ p: 4, mt: 4, height: '250px', width: '100%' }}>
                    {!this.state.loading && (
                        <Chart
                            type="matrix"
                            data={this.state.chartData}
                            options={options}
                        />
                    )}
                </Box>
            </div>
        );
    }
}

class ViewDepthCommentReply extends Component {

    constructor(props) {
        super(props)
    }
    render() {
        return (
            <>
                {/* The main blur backdrop */}
                <div className="share-comment-overlay">
                    {/* The actual share box */}
                    <div className="share-comment-modal">

                        <div className="share-modal-header">
                            <span>Comment</span>
                            <button onClick={() => { this.props.close() }} className="close-btn">×</button>
                        </div>

                        {/* Sample Content Preview */}
                        <div className="share-content-preview">
                            <p className="preview-body">
                                {this.props.content.comments}
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