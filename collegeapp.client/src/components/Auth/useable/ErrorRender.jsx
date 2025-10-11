import React, { Component } from 'react';
import "../../../static/auth/useable/error.css";
export class BasicError extends Component {
    constructor(props) {
        super(props);
        this.componentDidMount = this.componentDidMount.bind(this);
    }
    state = {
        errors: []
    }
    componentDidMount() {
        this.setState({ errors: this.props.errors });
    }
    render() {
        return (
            <>
                {this.state.errors.length > 0 ? this.state.errors.map((i, j) => {
                    return (
                        <div key={j} className="error-user-admin" role="alert">
                            {i.value}
                            {j === 0 ? (
                                <div className='cancel-x' onClick={() => { this.setState({ errors: [] }) }}>
                                    x
                                </div>
                            ) : null}
                        </div>
                    )
                }) : null}
            </>
        )
    }
}