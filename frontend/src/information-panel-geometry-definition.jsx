require('./css/style.css');
const     _ = require('lodash');
const     $ = require('jquery');


const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;

require('./css/information-panel.css');


class InformationPanelGeometryDefinition extends React.Component {

  constructor(props) {
    super(props);
    console.log('InformationPanelGeometryDefinition:: constructor');
    this.state = {
    };
  }

  render() {
    const style1 = {
//      backgroundColor: 'red',
      padding: '2px'
    };
    const style2 = {
      backgroundColor: 'blue',
      padding: '2px'
    };

    const geometries = this.props.geometriesNames.map((x)=>{
      return (
        <div key={x} className='row no-gutters' style={style1}>
          {x}
        </div>
      );
    });
    
    return (
      <div id='detailInformation' className='col-4 padding-0' style={{backgroundColor: 'lightgrey'}}>
        <div style={{backgroundColor: 'red'}}>
          <div className='row no-gutters' style={style1}>
            Έχετε ορίσει τις παρακάτω γεωμετρίες
          </div>
          {geometries}
        </div>
        <div className='row no-gutters' style={style2}>
            Γεωμετρία υπό ορισμό
        </div>        
      </div>
    );
  }
}
      

export default InformationPanelGeometryDefinition;

