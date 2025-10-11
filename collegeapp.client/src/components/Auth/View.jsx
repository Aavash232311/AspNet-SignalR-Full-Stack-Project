import React, { Component } from 'react';
import { DashboardNav } from '../../Dashboard';
import "../../static/auth/view.css";
import Services from '../../utils/utils';
import * as signalR from "@microsoft/signalr";
import { FaChevronUp, FaRegComment, FaShare } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { X } from '@mui/icons-material';

class Comment extends Component {
    constructor(props) {
        super(props);
        this.addComment = this.addComment.bind(this);
        this.replyCommennt = this.replyCommennt.bind(this);
    }

    services = new Services();
    url = new URLSearchParams(window.location.search);

    state = {
        page: 1,
        confessions: [],
        totalPages: 1
    }

    componentDidMount() {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub")
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", function (comment) {
            this.setState((prevState) => ({
                confessions: [comment, ...prevState.confessions]
            }));
        }.bind(this));

        connection
            .start()
            .then(() => {
                return connection.invoke("JoinChat", (this.url.get("topic").toString()));
            })
            .catch((err) => console.error("Connection failed: ", err));


        fetch(`Confession/GetComments?confessionId=${this.url.get("topic")}&page=${this.state.page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get"
        }).then((r) => r.json()).then((response) => {
            const { statusCode, value } = response;
            if (statusCode === 200) {
                const { confessionsComment, totalConfession, totalPages } = value;
                this.setState({
                    confessions: confessionsComment,
                    totalConfession,
                    totalPages
                });
            }
        })
    }

    replyCommennt(parent, domEvent) {
        /* Let's creare a JSX like in the reddit or facebook,
        Based on the parent position we add blocks of white space in grid,
        first let's find out the order of comment, if it's parent then order is 1,
        if its first child then order is 2, and so on and so on, we can do this my traditional recursion.  */
        const id = "CC8DE09E-952C-49DF-BB06-08DDE1A43358";
        const { confessions } = this.state;
        console.log(this.state);

        const recursiveTravesal = (commentId, rootComment, depth = 0) => {
            const findRoot = rootComment.find((x) => (x.id).toLowerCase() === commentId.toLowerCase());
            if (findRoot) {
                return depth; // top depth
            }
            for (const rep in rootComment) {
                const replies = rootComment[rep].replies;
                const findInReplies = replies.find((x) => x.id === commentId);
                if (findInReplies === undefined) {
                    recursiveTravesal(commentId, replies);
                }
            }
            return depth + 1;
        }
        console.log(recursiveTravesal(id, confessions));

        const customJSX = (
            <>

            </>
        );
    }

    addComment(ev) {
        ev.preventDefault();
        const formData = new FormData(ev.target);
        const comment = formData.get("comment");
        fetch(`Confession/AddComment?comments=${comment}&confessionId=${this.url.get('topic')}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "post"
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                ev.target.reset();
                return;
            }
        });
    }

    render() {
        return (
            <form onSubmit={this.addComment}>
                <hr />
                <textarea name="comment" className='form-control' placeholder='add comment' id=""></textarea>
                <br />
                <button type='submit' className='btn btn-primary btn-sm'>Add</button>
                <hr style={{ visibility: "hidden" }} />
                <div id='chat-fourm-frame'>
                    {this.state.confessions.length > 0 && (
                        <>
                            {this.state.confessions.map((i, j) => {
                                return (
                                    <React.Fragment key={j}>
                                        <div className='comment-frames'>
                                            <div className='profile-and-name'>
                                                <div style={{ backgroundColor: i.profileColor, color: "white" }} id='profile-circle'>
                                                    A
                                                </div>
                                                <div style={{ textAlign: "left" }} className='anonymous-user-label'>
                                                    Anonymous participant {(i.id).substring((i.id).length - 5, (i.id).length)  /* Giving the id of the last number of the GUID since they have fixed number of length */}
                                                </div>
                                            </div>
                                            <div className='commenct-frame'>
                                                {i.comments}
                                            </div>
                                            <div id='manipulate-comment'>
                                                <div className='center-flex-grid'>
                                                    <FaRegComment onClick={(ev) => { this.replyCommennt(i, ev) }} />
                                                </div>
                                                <div className='center-flex-grid'>
                                                    <FaChevronUp />
                                                </div>
                                                <div className='center-flex-grid'>0</div>
                                                <div>
                                                    <FaChevronDown />
                                                </div>
                                                <div className='center-flex-grid'>0</div>
                                                <div className='center-flex-grid'>
                                                    <FaShare />
                                                </div>
                                            </div>
                                        </div>
                                        <hr style={{ visibility: "hidden" }} />
                                    </React.Fragment>
                                )
                            })}
                        </>
                    )}
                </div>
                <hr style={{ visibility: "hidden" }} />
            </form>
        )
    }
}

export default class View extends Component {
    constructor(props) {
        super(props);
    }

    services = new Services();
    url = new URLSearchParams(window.location.search);
    state = {
        confession: null,
        comment: []
    }
    componentDidMount() {
        fetch(`Confession/GetCurrentConfession?id=${this.url.get("topic")}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "get"
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                this.setState({ confession: response.value });
            }
        });
    }

    render() {
        return (
            <DashboardNav>
                <center>
                    <div id="view-frame">
                        {this.state.confession !== null ? (
                            <>
                                <div>
                                    <div id='confession-topic'>
                                        <br />
                                        <h5 style={{ fontWeight: "lighter" }}>
                                            {this.state.confession.topic}
                                        </h5> <br />
                                        <div>
                                            {this.state.confession.description}
                                        </div>
                                        <Comment />
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </center>
            </DashboardNav>
        )
    }
}