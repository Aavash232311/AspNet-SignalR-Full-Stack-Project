import React, { Component } from "react";
import "../../static/auth/view.css";
import Services from "../../utils/utils";
import * as signalR from "@microsoft/signalr";
import { FaChevronUp, FaRegComment, FaShare } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import SideNavPost from "./useable/SideNavPost";

// here comment is the child comment
export const recursiveTraversal = (comment, rootComment) => {
  const { id } = comment;
  const findRoot = rootComment.find(
    (x) => x.id.toLowerCase() === commentId.toLowerCase()
  );
  if (findRoot) findRoot; // we found the root comment
  // if we can't find it in the first order object then we need to destructure replies and then we can work on it

  // rootComment are the list of comments, we might want to go thorught all that
  for (const rep in rootComment) {
    const replies = rootComment[rep].replies; // this is list of replies associated with, the parent comment i.e every comment on the list
    const findInReplies = replies.find((x) => x.id === commentId); // okay, here the reply is top compoenent now, okay so we could look at the replies of replies
    if (findInReplies === undefined) {
      recursiveTravesal(commentId, replies);
    } else {
      const check_if_already_exist = findInReplies.replies.find(
        (x) => x.id === id
      );
      if (check_if_already_exist === undefined) {
        findInReplies.replies.push(comment);
      }
      return rootComment; // return the root comment and we will change the state
    }
  }
};
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
  };

  componentDidMount() {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/chatHub")
      .withAutomaticReconnect()
      .build();

    connection.on(
      "ReceiveMessage",
      function (comment) {
        // here we are adding things in the parent state, we need to
        // get the parent and append to it's child

        /* Here once the data arrives we need to put where it belongs.  */
        const parent = recursiveTraversal(comment, this.state.confessions);
        console.log("This should be root comment", parent);
        this.setState((prevState) => ({
          /* Here when the data comes via web socket it's not structured correctly we need
           * to fix that, and if necessary we need to write more logic to fix it */
          // so once the data arrives here we need to check and the structure of the data to check it.
          // confessions: [comment, ...prevState.confessions]
        }));
      }.bind(this)
    );

    connection
      .start()
      .then(() => {
        return connection.invoke("JoinChat", this.url.get("topic").toString());
      })
      .catch((err) => console.error("Connection failed: ", err));

    fetch(
      `Confession/GetComments?confessionId=${this.url.get("topic")}&page=${
        this.state.page
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.services.accessToken()}`,
        },
        method: "get",
      }
    )
      .then((r) => r.json())
      .then((response) => {
        const { statusCode, value } = response;
        if (statusCode === 200) {
          const { data, totalObjects, totalPages } = value;
          this.setState({
            confessions: data,
            totalObjects,
            totalPages,
          });
        }
      });
  }

  getCommentsChildren() {
    // we need to fetch the comment associated with the parent compoenent
    fetch(
      `Confession/GetComments?confessionId=${this.url.get("topic")}&page=${
        this.state.page
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.services.accessToken()}`,
        },
      }
    )
      .then((r) => r.json())
      .then((response) => {
        const { statusCode, value } = response;
        if (statusCode === 200) {
          const { confessionsComment, totalConfession, totalPages } = value;
          this.setState({
            confessions: confessionsComment,
            totalConfession,
            totalPages,
          });
        }
      });
  }

  // todo: Real problem is we need to retrigger this chat with the websocket,
  // and make sure its not hard coded and componenets can be re-used later on.

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
    fetch(
      `Confession/AddComment?comments=${comment}&confessionId=${this.url.get(
        "topic"
      )}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.services.accessToken()}`,
        },
        method: "post",
      }
    )
      .then((r) => r.json())
      .then((response) => {
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
      <div>
        <hr />
        <form onSubmit={this.addComment}>
          <textarea
            name="comment"
            className="form-control"
            placeholder="add comment"
            id=""
          ></textarea>
          <br />
          <button type="submit" className="btn btn-primary btn-sm">
            Add
          </button>
          <hr style={{ visibility: "hidden" }} />
        </form>
        <div id="chat-fourm-frame">
          {this.state.confessions.length > 0 && (
            <>
              {this.state.confessions.map((i, j) => {
                // Okay here the current model that we are iterating is the parent model,
                // And, we need to check if all the replies that we have parent Id as current
                return (
                  <React.Fragment key={j}>
                    <CommentRenderCompoenent obj={i} />
                    <hr style={{ visibility: "hidden" }} />
                    {/* Here we have a problem once, we load
                                        replies of the parent having children id this one get's hidden
                                        we need to figure out how that happened */}
                    {i.replies.length == 0 && (
                      <>
                        <a>load comments</a>
                      </>
                    )}
                    {/* If the current compoenent has like replies comment then we might want to render that */}
                    <CommentRecurComponent replies={i.replies} />
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
        <hr style={{ visibility: "hidden" }} />
      </div>
    );
  }
}

class CommentRenderCompoenent extends Component {
  constructor(props) {
    super(props);
    this.replyCommentUpload = this.replyCommentUpload.bind(this);
  }
  url = new URLSearchParams(window.location.search);
  services = new Services();
  replyCommentUpload(ev, parentId) {
    ev.preventDefault();
    const data = new FormData(ev.target);
    const comment = data.get("comment");

    fetch(
      `Confession/ReplyComment?comment=${comment}&confessionId=${this.url.get(
        "topic"
      )}&parentId=${parentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.services.accessToken()}`,
        },
        method: "post",
      }
    )
      .then((r) => r.json())
      .then((response) => {
        const { statusCode } = response;
        if (statusCode === 200) {
          ev.target.reset();
          return;
        }
      });
  }

  render() {
    const i = this.props.obj;
    return (
      <React.Fragment>
        <div className="comment-frames">
          <div className="profile-and-name">
            <div
              style={{ backgroundColor: i.profileColor, color: "white" }}
              id="profile-circle"
            >
              A
            </div>
            <div style={{ textAlign: "left" }} className="anonymous-user-label">
              Anonymous participant{" "}
              {i.id.substring(i.id.length - 5, i.id.length)}
            </div>
          </div>
          <div className="commenct-frame">{i.comments}</div>
          <div id="manipulate-comment">
            <div className="center-flex-grid">
              <FaRegComment
                onClick={(ev) => {
                  this.replyCommennt(i, ev);
                }}
              />
            </div>
            <div className="center-flex-grid">
              <FaChevronUp />
            </div>
            <div className="center-flex-grid">0</div>
            <div>
              <FaChevronDown />
            </div>
            <div className="center-flex-grid">0</div>
            <div className="center-flex-grid">
              <FaShare />
            </div>
          </div>
          <form
            onSubmit={(ev) => {
              this.replyCommentUpload(ev, i.id);
            }}
          >
            <div className="input-group">
              <input
                type="text"
                className="input"
                placeholder="write a comment!"
                autoComplete="off"
                name="comment"
              />
              <input
                className="button--submit"
                defaultValue="Subscribe"
                type="submit"
              />
            </div>
          </form>
        </div>
      </React.Fragment>
    );
  }
}

/* It's not "Web Dev" that people think it is, it's a complicated stuff here, 
You are managing a web socket's, making things re useable, you need to check the data structure
and make sure it works both from web socket and logcal data, rendering happens smoothly, it's problem solving,
make it clear and consise in future if you were to debug it you will have problem yourself. */

class CommentRecurComponent extends Component {
  // this is recursive component, which is used to render comment and add comment options, this might be little confusing to make
  // because our mind might go to recursive hell.
  constructor(props) {
    super(props);
    this.loadReplyComments = this.loadReplyComments.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
  }

  state = {
    replies: [], // this is the parent reply that get's loaded there in the state
    nextedReply: [],
    parentId: "",
  };

  // Problem this runs, one per compoenent instance, for first instant of a compoenent render "root node"

  componentDidMount() {
    // here filter reply only if that exists in the parent
    const parentId = this.props.parentId;
    const replies = this.props.replies;
    let filteredList = replies.filter((i) => i.parentId === parentId);
    if (parentId === undefined) {
      filteredList = this.props.replies; // for first order parent we need to have an expection
      this.setState({ replies: filteredList });
      return;
    }
    if (filteredList.length > 0) {
      this.setState({ replies: filteredList });
    }
    // doing this to make it depend upon the state
  }

  /* The way we are using recursion here is making this
    compoenentDidUpdate() superset of compoenentDidMount(),
    we need to figure out the way in the case where the did mount does not get called we can track the changes here
  */
  componentDidUpdate(prevProps, prevState) {
    if (prevState.nextedReply !== this.state.nextedReply) {
      // we need to know on which invoke this componenet is called to render, else we will have a problem
      const { nextedReply, parentId } = this.state;
      const filterCurrentChildren = nextedReply.filter(
        (i) => i.parentId === parentId
      );
      // here things have gone little complicated we can't just do hit and trial
      const { replies } = this.state; // this replies has parent and children where it's only suppose to have chidren
      /* If the instance of compoenent didmount() did not get called then, if we could figure out a way am I hard coading it */

      console.log("What's suppose to be a reply: ", nextedReply, "Actual Reply: ", replies);
      //   this.setState({ replies: filterCurrentChildren });
    }
  }

  /* In this method what we need to do is, check for the particular current parent comment 
    and then based on that we can fetch the result. */

  async loadReplyComments(currentParentComment) {
    const request = await fetch(
      `Confession/get-children-comments?parentId=${currentParentComment.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${new Services().accessToken()}`,
        },
        method: "get",
      }
    ); // ressolving this promise
    const response = await request.json();
    const { statusCode, value } = response;
    // we have glitch in the react code, not the response given by our asp.net server.
    if (statusCode === 200) {
      const originalParentComment = this.props.replies.find(
        (i) => i.id === currentParentComment.id
      );
      originalParentComment.replies = value; // mutating the original parent comment
      // I think we need to change the higer order object of that, to make it re render properly,
      // And, yes that's the case
      // We do not need to poke the state here as it would increase the compleixty of our code.
      if (value.length === 0) return;
      /* We have a problem,
              Report: the compoenent does not get rendered properly. When we click back and forth between one parent having multiple
              children even though  we can clearly see the values if we log in here.
              
              OKay so I tried doing 
                      this.setState({ nextedReply: [] }, () => {
                this.setState({nextedReply: originalParentComment.replies});
            }); // mutating the state directly

            It solved the problem for a while then, it make the other compoenent hide. You know what could be the problem,
            They way we are modifing the actual "parent state" we need to fix that.

            Problem is really depth, it lies in the heart of how these react state work.
            */

      this.setState({
        nextedReply: originalParentComment.replies,
        parentId: currentParentComment.id,
      });
      // console.log(
      //   this.props.replies,
      //   "Showing for parent: ",
      //   originalParentComment.comments,
      //   "Replies:",
      //   originalParentComment.replies
      // );

      // mutating the state directly
    }
  }

  render() {
    /* Here what this code does it, it checks if we have reply which is greater than 0
        if not then we can click to make a fetch api call to render more,
        what are the props passed to this compoenent, it's the parent compoenent okay
        if we have children then we render children. If not then we can ask to make a fetch call, */

    // this occours in recursion so let's label and logs things into console and check
    if (this.state.replies.length <= 0) return <></>;
    const testArr = [];
    for (let i in this.state.replies) {
      testArr.push(this.state.replies[i].comments);
    }
    // console.log(
    //   "Parent: ",
    //   testArr.join(),
    //   "Replies List: ",
    //   this.state.nextedReply
    // );
    return (
      <>
        <div className="recur-comment-frame">
          <>
            {this.state.replies.map((i, j) => {
              return (
                <React.Fragment key={j}>
                  {/* This compoenet is used to render the comment frame like all the wrappers and stuff */}
                  <CommentRenderCompoenent obj={i} />
                  {
                    <>
                      <a
                        onClick={() => {
                          this.loadReplyComments(i);
                        }}
                        className="load-comments-anchors"
                      >
                        load comments
                      </a>
                    </>
                  }
                  {this.state.nextedReply.length > 0 && (
                    <>
                      <CommentRecurComponent
                        replies={this.state.nextedReply}
                        parentId={i.id}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </>
        </div>
      </>
    );
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
    comment: [],
  };
  componentDidMount() {
    fetch(`Confession/GetCurrentConfession?id=${this.url.get("topic")}`, {
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
          this.setState({ confession: response.value });
        }
      });
  }

  render() {
    return (
      <SideNavPost>
        <center>
          <div id="view-frame">
            {this.state.confession !== null ? (
              <>
                <div>
                  <div id="confession-topic">
                    <br />
                    <h5 style={{ fontWeight: "lighter" }}>
                      {this.state.confession.topic}
                    </h5>{" "}
                    <br />
                    <div>{this.state.confession.description}</div>
                    <Comment />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </center>
      </SideNavPost>
    );
  }
}
