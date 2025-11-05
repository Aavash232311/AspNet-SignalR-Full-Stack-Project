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

const services = new Services();

export function StickyHeadTable(args) {
    const { props } = args;

    const { columns, pageNum, pageSize, rows } = props;
    let rowsPerPage = pageSize;
    return (
        <AdminContext.Consumer>
            {(adminProperties) => {
                return (
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: 440 }}>
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
        pageSize: 5
    }

    services = new Services();

    async componentDidMount() {
        const response = await fetch(`/Admin/recent-threads?page=${this.state.page}&pageSize=${this.state.pageSize}`, {
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

    static contextType = AdminContext;

    render() {

        const columns = [
            { id: 'id', label: 'Id', minWidth: 100 },
            { id: 'comments', label: 'Comment\u00a0Code', minWidth: 80 },
            {
                id: 'likes',
                label: 'Likes',
                minWidth: 10,
                align: 'right',
                format: (value) => value.toLocaleString('en-US'),
            },
            {
                id: 'added',
                label: 'Added Date',
                minWidth: 170,
                align: 'right',
                format: (value) => value.toLocaleString('en-US'),
            },
            {
                id: 'lastModified',
                label: 'Last modified',
                minWidth: 170,
                align: 'right',
                format: (value) => value.toFixed(2),
            },
            {
                id: 'userId',
                label: 'Auth0 Id',
                minWidth: 170,
                align: 'right',
                format: (value) => value.toFixed(2),
            },
            {
                id: 'confessionId',
                label: 'Confession Id',
                minWidth: 170,
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
            rows
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
                                {this.state.threads.length > 0 && <StickyHeadTable className="thread-admin-table" props={tableProps} />}
                                {this.state.threads.length > 0 && (
                                    <>
                                        <hr style={{ visibility: "hidden" }} />
                                        <Pagination
                                            count={10}
                                            page={1}
                                            color="primary"
                                            sx={dark === true ? darkPagination : {}}
                                        />

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