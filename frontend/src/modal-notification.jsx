const React = require('react');


const assert = require('chai').assert;



// redux
import { connect } from 'react-redux';
import { clearModal } from './actions/index.js';

import {Form, Col, Row, Button, Nav} from 'react-bootstrap';

const mapDispatchToProps = (dispatch) => {
  return {
    clearModal: ()=> dispatch(clearModal())
  };
}

class ModalNotification extends React.Component {

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount = () => {
    const domElem = this.ref.current;
    domElem.showModal();
  }

  render() {
    return (
      <>
      <dialog ref={this.ref}>
        {this.props.html}
        <Button variant='primary' onClick={this.props.clearModal}>OK</Button>
      </dialog>
      {this.props.children}
      </>
    )
  }
}


export default connect(null, mapDispatchToProps)(ModalNotification);

