const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;

// REDUX
import { connect }          from 'react-redux';

const mapStateToProps = (state) => {
  return {
    targetId: state.targetId
  };
};



class TargetMetadataPane extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            payload: null,
            error: null
        };
    }

    componentDidMount() {
    }
    
    componentDidUpdate(prevProps, prevState) {
    }


    render() {
        return (
            <div>
                metadata on {this.props.targetId}
            </div>
        );
    }
}

export default connect(mapStateToProps)(TargetMetadataPane);
