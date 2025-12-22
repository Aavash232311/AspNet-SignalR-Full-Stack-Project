import React, { Component } from 'react';
import "../../../static/auth/useable/prompt.css";

class DeleteApp extends Component {
    constructor(props) {
        super(props);
    }

    response = (status) => {
        this.props.output(status);
    }

    render() {
        return (
            <div className="container">
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Are you sure?</h3>
                        <p>Do you really want to delete this record? This process cannot be undone.</p>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => {this.response(false)}}>
                                No, Keep it
                            </button>
                            <button className="btn-confirm" onClick={() => {this.response(true)}}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DeleteApp;