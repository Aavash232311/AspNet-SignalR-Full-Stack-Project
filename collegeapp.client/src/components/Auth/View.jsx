import React, { Component } from "react";
import "../../static/auth/view.css";
import Services from "../../utils/utils";
import * as signalR from "@microsoft/signalr";
import { FaChevronUp, FaRegComment, FaShare } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import SideNavPost from "./useable/SideNavPost";
import { IoMdPaperPlane } from "react-icons/io";
import { AiOutlinePlusCircle } from "react-icons/ai";
// this is the reuseable recursive method for setting up in the hierarchial data tree,
// I think some languages that I have used in the past comes with built in method like this
// I had to heal with Response object and http header but this will do that job in our case.

// as a developer, if your recursion failed in client side, at wrost,
// all it can do is crash client's browser, but if it failed in server,it will break everything
export const setParentCommentValue = (rootNode, parentNode, value) => {
  const parentId = parentNode.id; // we need to find this "id" there and set it

  // search for parent
  const parent = rootNode.find((u) => u.id === parentId);

  if (parent === undefined) {
    // in not found case
    // we need to search its child, since it can multiple child we need to loop over;
    for (let i in rootNode) {
      const currentNode = rootNode[i];
      const { replies } = currentNode;
      return setParentCommentValue(replies, parentNode, value);
    }
  }
  parent.replies = value;
  return parent;
};

class Comment extends Component {
  constructor(props) {
    super(props);
    this.addComment = this.addComment.bind(this);
    this.dataOnRoot.bind(this);
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
        // everytime this socket get's triggred we need to make the data sync
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

  dataOnRoot = (parent) => {
    // here we might have binding issues, I came to know that arrow function automatically binds stuff
    const services = new Services();
    fetch(`Confession/get-children-comments?parentId=${parent.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${services.accessToken()}`,
      },
      method: "get",
    })
      .then((r) => r.json())
      .then((response) => {
        const { value, statusCode } = response;
        if (value.length === 0) return;
        const { confessions } = this.state;
        if (statusCode === 200) {
          
          setParentCommentValue(confessions, parent, value);
          this.setState({ confessions });
          return;
        }
      });
  };

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
                    {/* If the current compoenent has like replies comment then we might want to render that */}

                    <CommentRecurComponent
                      load={this.dataOnRoot}
                      children={i.replies}
                    />
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
  state = {
    showReplyThread: false,
  };
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
                onClick={() => {
                  this.state.showReplyThread === true
                    ? this.setState({ showReplyThread: false })
                    : this.setState({ showReplyThread: true });
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
          {this.state.showReplyThread === true && (
            <>
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
                  <button
                    className="button--submit"
                    defaultValue="Subscribe"
                    type="submit"
                  >
                    <IoMdPaperPlane />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </React.Fragment>
    );
  }
}

/* It's not "Web Dev" that people think it is, it's a complicated stuff here, 
You are managing a web socket's, making things re useable, you need to check the data structure
and make sure it works both from web socket and logcal data, rendering happens smoothly, it's problem solving,
make it clear and consise in future if you were to debug it you will have problem yourself. 
And, who cares c# is in the backend with a database */

class CommentRecurComponent extends Component {
  // this is recursive component, which is used to render comment and add comment options, this might be little confusing to make
  // because our mind might go to recursive hell.
  constructor(props) {
    super(props);
    this.changeDemand.bind(this);
  }

  // Loading data on demand because, in a complex chat system there are lot's of user driven data, that might load our server,
  // like images and videos.

  state = {
    children: [],
  };

  services = new Services();

  // this get's called in one instance of class, we need to make this rely on single node
  // every time we pass that particular node, the compoenent should update
  // since it's a recursive compoenent
  componentDidMount() {
    // simple it's get loaded for first order "node"
    if (this.props.children !== undefined) {
      const { children } = this.props;
      this.setState(
        {
          children,
        },
        () => {}
      );
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.nextedReply !== this.state.nextedReply) {
    }
  }

  /* Here lies to mind blowing complixity of application,
      Recursion happens in two phases, first time this "compoenet" is called from parent compoenent,
      Second and "n" times this compoenent is called from this compoenent itself,
      Since we want to make data sync from web-sockets and fetch call. We want this all thing to render once the "root" node is changed, using "DSA"terminilogy

      For the first phase we could bing this, and invoke the method in parent componenet,
      For the second phase parent itself is the current child compoenent that's how recursion works in computer.

      Question is how do we bind in sucha way that things work out?
  */
  changeDemand = (obj) => {
    this.props.load(obj);
  };

  /* Here we need to make things to work such that everything depnds dupon the parent,
    compoenent, so that we can make the data sync between the data incomming from the websocket
    and the data that comes locally, and data that comes through fetch api, 
    In order to make something like that what we need to do is make this compoenent, 
    send the fetched data to parent compoenet and this data compoenent get's called again. */

  render() {
    /* Here what this code does it, it checks if we have reply which is greater than 0
        if not then we can click to make a fetch api call to render more,
        what are the props passed to this compoenent, it's the parent compoenent okay
        if we have children then we render children. If not then we can ask to make a fetch call,


        root comment = {
        children_comment: [{
            children_Comment: [{
            }]
        }]; /// this is same data that comes from fetch() call websocket() and local data()
        
    }
        */

    const { children } = this.state;
    const { load } = this.props; // OH WOW, DESTRUCTURING HERE WORKS, NOT IN THE PARAMTER OF THE COMPOENENT THERE IS A DIFFERENCE

    return (
      <>
        <div className="recur-comment-frame">
          {children.length > 0
            ? children.map((i, j) => {
                const { replies, replyCount } = i;
                return (
                  <React.Fragment key={j}>
                    <CommentRenderCompoenent obj={i} />
                    <>
                      <a
                        onClick={() => {
                          this.changeDemand(i);
                        }}
                      >
                      thread {replyCount !== undefined ? replyCount : null} <AiOutlinePlusCircle />
                      </a>
                      {replies.length > 0 && (
                        <>
                        
                          <CommentRecurComponent
                            children={i.replies}
                            load={load}
                          />
                        </>
                      )}
                    </>
                  </React.Fragment>
                );
              })
            : null}
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
