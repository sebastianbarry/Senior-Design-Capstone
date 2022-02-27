import { groupBy, getNotes } from './functions.js';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useState } from 'react';

var isDarkBackground = function(bgCol) {
  // let RGB is a variable that dynamically sets the color of each box and calculates the brightness of the color. based on the color, we set it so that the text color will be black or white based on the brightness of the box color
    let bgRGB = bgCol.slice(1).match(/.{1,2}/g).map(x => Number.parseInt(x, 16));
    return (bgRGB[0]*0.299 + bgRGB[1]*0.587 + bgRGB[2]*0.114) > 186;
}

class FlowChartItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // each element for the class description is separated into its own section for future modifications/styling 

    // If the class is in the taken classes add class to signal that
    // need spaces so that if there are different css styling elements that need to be applied, that the className property can differentiate from them
    return (
      // overlay trigger will display additional description about the class once it is clicked. The overlay trigger is wrapped around the content/div area that should be clicked to activate the pop up window, root close means that the other pop up will hide when the user clicks somewhere else outside of the box
      // Overlay Reference: https://react-bootstrap.github.io/components/overlays/
      <OverlayTrigger trigger="click" rootClose={true} placement="auto" overlay={
        <Popover id={"popover" + this.props.Name}>
          <Popover.Header as="h3">{this.props.Name}</Popover.Header>
          <Popover.Body>
            {!!this.props.cl && this.props.cl.Desc}
          </Popover.Body>
        </Popover>}>
        <div style={{backgroundColor: this.props.bgCol, color: isDarkBackground(this.props.bgCol) ? "#000000" : "#ffffff"}} 
        className={'flow-box ' + 
        (this.props.taken ? ' taken-class' : '') + (this.props.isPreReq ? ' pre-reqs' : '')}
        onMouseEnter={this.props.enterFunc /* calls change function passed as property when checkbox is toggled*/}
        onMouseLeave={this.props.leaveFunc}>
          <div className='flow-id'>{this.props.Name}</div>
          <div className='flow-credits'>{this.props.Credits}</div>
          <div className={this.props.displayAll ? '': 'flow-desc'}>
            {/* !!this.props.cl && this.props.cl.(key) checks that if the element is not null then display this element property (conditional rendering) */}
            <div className='flow-name'>{!!this.props.cl && this.props.cl.Name}</div>
            <div className='flow-restriction'>{!!this.props.Restriction && '*' + this.props.Restriction + '*'}</div>
            <div className='flow-notes'>{!!this.props.cl && getNotes(this.props.cl.Prereqs)}</div>
          </div>
        </div>
      </OverlayTrigger>
    );
  }
}

function FlowChart(props) {

  let [curPrereqs, setPrereqs] = useState([]);

  /*** Calculates amount of credit hours that are needed for a list of flowchart classes
   * And the total number of credit hours that have been taken from the classes
   * Takes: list of flowchart classes ***/
  const calculateSemHours = classList => {
    let [total, taken] = [0, 0];
    for (let cl of classList) {
      total += parseInt(cl.Credits);
      taken += cl.checked ? parseInt(cl.cl.Credits) : 0; // if checked (taken) add to count
    }
    return [taken, total];
  }

  const byColor = (a, b) => props.ColorOrder.indexOf(a[0]) - props.ColorOrder.indexOf(b[0]);

  let legend = Object.entries(props.Colors).sort(byColor).map(([name, color]) => ( 
    <div 
      key={'legend'+name}
      className="flow-box-legend" 
      style={{backgroundColor: color, color: isDarkBackground(color) ? "#000000" : "#ffffff"}}>
      {name}
    </div>
  ));

  // get classes grouped by semester (using global function)
  let semClasses = groupBy(props.Classes, x => x.Semester);
  // get classes grouped by semester to be grouped by year
  let yearSems = groupBy(Object.entries(semClasses), x => x[0].split('-')[1]);
  // returns html for entire flowchart 
  return (
    <Container fluid id='flowchart'>
      <Row>
        {// create all of the html code for the years by mapping each entry to the code
         // uses map to loop and extract year number in 'year' and list of semesters in 'sems'
        Object.entries(yearSems).map(([year, sems]) => (
          // makes new column for each year with table inside for semesters
          <Col key={'colyear' + year} lg={3} sm={6} xs={12} className='yearcol'>
            <Container>
              <Row><Col className='year-header'>Year {year}</Col></Row>
              <Row className='sem-classes'>{
                // sort the semesters alphabetically, so that Fall always comes before Spring
                // uses map to loop and extract semester string in 'sem' and list of classes in 'classes'
                sems.sort((a, b) => a[0].localeCompare(b[0])).map(([sem, classes]) => (
                  <Col key={sem} md={6} xs={6} className='semcol'>
                    {/* Col: column tag, imported from bootstrap-react 
                      key attribute is used as a unique identifier for an item in a list in react */}
                    <div className='sem-header'>{sem.split('-')[0]}</div>
                    <div className='sem-credits'>{calculateSemHours(classes).join(' / ') + ' credits taken'}</div>
                    {classes.sort(byColor).map((cl, i) => (
                      // FlowChartItem tag will contain the information about the class (what class you are taking that semester will be displayed)
                      <FlowChartItem
                        key={sem + 'class' + i}
                        {...cl}
                        isPreReq={curPrereqs.includes(cl.Name)}
                        enterFunc={() => setPrereqs((!!cl.cl && !!cl.cl.Prereqs) ? cl.cl.Prereqs : [])}
                        leaveFunc={() => setPrereqs([])}
                      ></FlowChartItem>))}
                  </Col>))
              }</Row>
            </Container>
          </Col>))}
      </Row>
      <div className="flow-legend">
        {legend}
      </div>
    </Container>
  );
}

export default FlowChart;