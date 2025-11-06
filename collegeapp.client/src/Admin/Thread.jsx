import React, { Component } from "react";
import { Admin, AdminContext } from "./Admin.jsx";
import { Toolbar, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Services from "../utils/utils.js";
import Pagination from '@mui/material/Pagination';
import "../static/auth/Admin/thread.css";
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

const services = new Services();

export function StickyHeadTable(args) {
    const { props } = args;

    const { columns, pageNum, pageSize, rows } = props;

    const viewContent = (objectId) => {
        const { props } = args;
        const { viewPage } = props;
        viewPage(objectId);
    }
    return (
        <AdminContext.Consumer>
            {(adminProperties) => {
                return (
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: 440, overflowX: "auto" }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={column.align}
                                                style={{ minWidth: column.minWidth }}
                                            >
                                                {column.label}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            Action
                                        </TableCell>
                                        <TableCell>
                                            View
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows
                                        .map((row) => {
                                            return (
                                                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                                    {columns.map((column) => {
                                                        /* Here in this MUI table things are done little bit different,
                                                        We are iterating over each rows, and we pick the value based on
                                                        the column header to put the stuffs in, for that we need to labal a reference
                                                         */
                                                        const value = row[column.id];
                                                        return (
                                                            <TableCell key={column.id} align={column.align}>
                                                                {/* {services.substring(services, 20)} */}
                                                                {column.id === "comments" ? services.substring(value, 20) : services.substring(value, 10)}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell>
                                                        <button className="btn btn-outline-danger btn-sm">
                                                            Delete
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button onClick={() => { viewContent(row["id"]) }} className="btn btn-outline-primary">
                                                            View
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )
            }}
        </AdminContext.Consumer>
    );
}
export default class Thread extends Component {

    constructor(props) {
        super(props);
        this.componentDidMount.bind(this);
    }

    state = {
        totalPages: 1,
        threads: [],
        page: 1,
        pageSize: 5,
        viewContant: null,
        userInfo: null,
    }

    services = new Services();


    getThreads = async (page) => {
        const response = await fetch(`/Admin/recent-threads?page=${page}&pageSize=${this.state.pageSize}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "GET",
        });
        const res = await response.json();
        const { value } = res;
        const { totalPages, data } = value;
        this.setState({ threads: data, totalPages });
    }

    async componentDidMount() {
        this.getThreads(this.state.page);
    }

    static contextType = AdminContext;

    view = (objectId) => {
        const { threads } = this.state;
        const findObjectToView = threads.find((x) => x.id === objectId);
        if (findObjectToView !== undefined) {
            this.loadUser(findObjectToView.userId).then(() => {
                this.setState({ viewContant: findObjectToView });
            });
        }
    }

    handleChange = (ev, val) => {
        this.getThreads(val);
        this.setState({ page: val });
    }

    loadUser = async (userId) => {
        var res = await fetch(`/Admin/get-clientinfo?auth0Id=${userId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "GET"
        });
        var data = await res.json();
        const { value } = data;
        this.setState({ userInfo: value })
    }

    render() {

        const columns = [
            { id: 'id', label: 'Id', minWidth: 100 },
            { id: 'comments', label: 'Comment\u00a0Code', minWidth: 80 },
            {
                id: 'likes',
                label: 'Likes',
                align: 'right',
                format: (value) => value.toLocaleString('en-US'),
            },
            {
                id: 'added',
                label: 'Added Date',
                align: 'right',
                format: (value) => value.toLocaleString('en-US'),
            },
            {
                id: 'lastModified',
                label: 'Last modified',
                align: 'right',
                format: (value) => value.toFixed(2),
            },
            {
                id: 'userId',
                label: 'Auth0 Id',
                align: 'right',
                format: (value) => value.toFixed(2),
            },
            {
                id: 'confessionId',
                label: 'Confession Id',
                align: 'right',
                format: (value) => value.toFixed(2),
            },
        ];

        let rows = [];
        if (this.state.threads.length > 0) {
            rows = this.state.threads;
        }

        const tableProps = {
            columns,
            pageNum: this.state.page,
            pageSize: this.state.pageSize,
            rows,
            viewPage: this.view
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
                                <Typography variant="h4">Thread page</Typography>
                                <p>Admin confession control.</p>
                                {this.state.viewContant === null &&
                                    (<>
                                        {this.state.threads.length > 0 && <StickyHeadTable className="thread-admin-table" props={tableProps} />}
                                        {this.state.threads.length > 0 && (
                                            <>
                                                <hr style={{ visibility: "hidden" }} />
                                                <Pagination
                                                    count={this.state.totalPages}
                                                    page={this.state.page}
                                                    color="primary"
                                                    onChange={this.handleChange}
                                                    sx={dark === true ? darkPagination : {}}
                                                />

                                            </>
                                        )}
                                    </>
                                    )}

                                {this.state.viewContant !== null && (
                                    <>
                                        <div className={`view-content-thread-admin ${dark === true ? "p-3 mb-2 bg-dark text-white" : ""}`} id="view-table">
                                            <div className="admin-view-thread-labels" style={{ textAlign: "right" }}>
                                                <CancelIcon style={{ color: dark === true ? "white" : "black" }} onClick={() => { this.setState({ viewContant: null }) }} />
                                            </div>
                                            <h6 className="h6">
                                                View Content
                                            </h6>
                                            <table className={`table ${dark === true ? "table-dark table-striped" : ""}`} >
                                                <thead>
                                                    <tr>
                                                        {Object.entries(this.state.viewContant).map((i, j) => {
                                                            const key = i[0]
                                                            if (key === "comments" || key === "replies") return;
                                                            return (
                                                                <React.Fragment key={j}>
                                                                    <th>
                                                                        {key}
                                                                    </th>
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        {Object.entries(this.state.viewContant).map((i, j) => {
                                                            let value = i[1];
                                                            const key = i[0];
                                                            if (key === "comments" || key === "replies") return;
                                                            if (key === "parentId" && value === null) {
                                                                value = "Root thread";
                                                            }


                                                            return (
                                                                <React.Fragment key={value + Math.random(0, 1000)}>
                                                                    <th>
                                                                        {key === "profileColor" ? (
                                                                            <>
                                                                                <div className="profile-color-shample-admin" style={{ backgroundColor: value }}>

                                                                                </div>
                                                                            </>
                                                                        ) : value}
                                                                    </th>
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <hr />
                                            <textarea className={`form-control ${dark === true ? "p-3 mb-2 bg-dark text-white" : ""}`} readOnly defaultValue={this.state.viewContant.comments}></textarea>
                                            <hr />
                                            <h6 className="h6">
                                                User Information
                                            </h6>
                                            <Auth0User userInfo={this.state.userInfo} />
                                        </div>
                                    </>
                                )}

                            </>
                        )
                    }}
                </AdminContext.Consumer>
            </Admin>
        )
    }
}

export class Auth0User extends Component {
    constructor(props) {
        super(props);
    }


    state = {
        userInfo: null,
    }

    services = new Services();

    async componentDidMount() {
        if (this.props.userInfo === null) return;
        this.setState({ userInfo: this.props.userInfo });
    }
    render() {
        return (
            <>
                <AdminContext.Consumer>
                    {(adminProperties) => {
                        const { dark } = adminProperties;
                        if (this.state.userInfo === null) return (
                            <>
                                <b>No information</b>
                            </>
                        );
                        const { email, email_verified, name, nickname, logins_count, created_at, last_login, picture, updated_at, user_id } = this.state.userInfo;
                        return (
                            <>
                                <table className={`table ${dark === true ? "table-dark" : ""}`} >
                                    <thead>
                                        <tr>
                                            <th>User email</th>
                                            <th>{email}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <th>Email verified</th>
                                            <th>{email_verified === true ? <VerifiedIcon /> : <NewReleasesIcon />}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Name</th>
                                            <th>{name}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Nickname</th>
                                            <th>{nickname}</th>
                                        </tr>
                                    </tbody>

                                    <tbody>
                                        <tr>
                                            <th>Login count</th>
                                            <th>{logins_count}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Account created</th>
                                            <th>{this.services.normalizeASPDate(created_at)}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Last login</th>
                                            <th>{this.services.normalizeASPDate(last_login)}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Updated At</th>
                                            <th>{this.services.normalizeASPDate(updated_at)}</th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Picture</th>
                                            <th>
                                                <img className="profile-color-shample-admin" src={picture} alt="" />
                                            </th>
                                        </tr>
                                    </tbody>
                                    <tbody>
                                        <tr>
                                            <th>Auth0 Id</th>
                                            <th>{user_id}</th>
                                        </tr>
                                    </tbody>
                                </table>
                            </>
                        )
                    }}
                </AdminContext.Consumer>
            </>
        )
    }
}