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
        // first thing we need to get the parent here, alr then we can render its children okay.
        // And, then we can pass the parameter to the children component.
        // In my expreience of making this like that, we need to do more things to first order stuff. 
        const { replies, id } = parent;
        const { confessions } = this.state;
        console.log(this.state);

        /* Okay so what will be the rendering flow and the API call look like then,
        When we click on reply or view reply then it should render things,
        If the reply is large then we need to render view reply
        Else we must be able to expand all the reply 
          */
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
                                        {/* <CommentRecurComponent replies={i.replies} /> */}
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


class CommentRecurComponent extends Component { // this is recursive component, which is used to render comment and add comment options, this might be little confusing to make
    // because our mind might go to recursive hell. 
    constructor(props) {
        super(props);
        console.log(props);
    }
    render() {
        return (
            <>

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