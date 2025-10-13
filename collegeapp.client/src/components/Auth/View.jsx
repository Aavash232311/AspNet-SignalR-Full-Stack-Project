import React, { Component } from 'react';
import { DashboardNav } from '../../Dashboard';
import "../../static/auth/view.css";
import Services from '../../utils/utils';
import * as signalR from "@microsoft/signalr";
import { FaChevronUp, FaRegComment, FaShare } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";

class Comment extends Component {
    constructor(props) {
        super(props);
        this.addComment = this.addComment.bind(this);
        this.replyCommennt = this.replyCommennt.bind(this);
        this.getCommentsChildren = this.getCommentsChildren.bind(this);
    }

    services = new Services();
    url = new URLSearchParams(window.location.search);

    state = {
        page: 1,
        confessions: [],
        totalPages: 1,
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
                const { data, totalObjects, totalPages } = value;
                this.setState({
                    confessions: data,
                    totalObjects,
                    totalPages
                });
            }
        })
    }

    getCommentsChildren() { // we need to fetch the comment associated with the parent compoenent
        fetch(`Confession/GetComments?confessionId=${this.url.get("topic")}&page=${this.state.page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
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
        });


    }

    replyCommennt(parent, domEvent) {
        /*
            Here we want to render and be able to reply to others messages just like in anyother blog or post platoform.
            Okay we first of all I guess we need to get list of comment associated with the parent comment. 
            And, then we can render the comment box below.

            We need to use concept called recursive component. It's a component that calls itself.
            Okay in the backend let's see how we get the data. Okay so the data is in nexted form.

        */
        const { replies, id } = parent;
        const { confessions } = this.state;
        /*
            Here we can use the concept of recursive component to render the children comment.
            Firstly we can expand the children to some depth, by default.
            We want to render depth = 1; which the default api in backend gives the result in depth one
        */
        // console.log(this.state);
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

    /* What we need to do is okay, we need to render the chuldren comment associated with everything we may hide it
    using css and later we can expand it.  */

    render() {
        /* If we want to expand the reply box table we need to change the Higher Order Object
        that we get from fetch API call so that we can re-render everything */
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
                                        <CommentRenderCompoenent obj={i} />
                                        <hr style={{ visibility: "hidden" }} />
                                        {i.replies.length == 0 && (
                                            <>
                                                <a>load comments</a>
                                            </>
                                        )}
                                        {/* If the current compoenent has like replies comment then we might want to render that */}
                                        <CommentRecurComponent replies={i.replies} />
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

class CommentRenderCompoenent extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const i = this.props.obj;
        return (
            <React.Fragment>
                <div className='comment-frames'>
                    <div className='profile-and-name'>
                        <div style={{ backgroundColor: i.profileColor, color: "white" }} id='profile-circle'>
                            A
                        </div>
                        <div style={{ textAlign: "left" }} className='anonymous-user-label'>
                            Anonymous participant {(i.id).substring((i.id).length - 5, (i.id).length)}
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
            </React.Fragment>
        )
    }
}


class CommentRecurComponent extends Component { // this is recursive component, which is used to render comment and add comment options, this might be little confusing to make
    // because our mind might go to recursive hell. 
    constructor(props) {
        super(props);
        this.loadReplyComments = this.loadReplyComments.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    state = {
        replies: [],
        nextedReply: []
    }

    componentDidMount() {
        this.setState({ replies: this.props.replies });
        // doing this to make it depend upon the state
    }

    /* In this method what we need to do is, check for the particular current parent comment 
    and then based on that we can fetch the result. */

    async loadReplyComments(currentParentComment) {
        const request = await fetch(`Confession/get-children-comments?parentId=${currentParentComment.id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${new Services().accessToken()}`,
            },
            method: "get",
        }); // ressolving this promise
        const response = await request.json();
        const { statusCode, value } = response;
        if (statusCode === 200) {
            const originalParentComment = this.props.replies.find((i) => i.id === "e32a1c21-90b3-496d-b693-08de0928184a");
            originalParentComment.replies = value; // mutating the original parent comment
            // I think we need to change the higer order object of that, to make it re render properly,
            // And, yes that's the case
            // We do not need to poke the state here as it would increase the compleixty of our code.
            this.setState({nextedReply: originalParentComment.replies}, () => {
                
            }); // mutating the state directly
        }
    }



    render() {
        /* Here what this code does it, it checks if we have reply which is greater than 0
        if not then we can click to make a fetch api call to render more,
        what are the props passed to this compoenent, it's the parent compoenent okay
        if we have children then we render children. If not then we can ask to make a fetch call, */
        return (
            <>
                <div className='recur-comment-frame'>
                    {this.state.replies.length > 0 && (
                        <>
                            {this.state.replies.map((i, j) => {
                                return (
                                    <React.Fragment key={j}>
                                        {/* This compoenet is used to render the comment frame like all the wrappers and stuff */}
                                        <CommentRenderCompoenent obj={i} />
                                        {i.replies.length == 0 && (
                                            <>
                                                <a onClick={() => {
                                                    this.loadReplyComments(i);
                                                }} className='load-comments-anchors'>load comments</a>
                                            </>
                                        )}
                                        {this.state.nextedReply.length > 0 && (
                                            <>
                                                <CommentRecurComponent replies={this.state.nextedReply} />
                                            </>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </>
                    )}
                </div>
            </>
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