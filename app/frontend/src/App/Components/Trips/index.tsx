import React, { Component } from 'react'
import { State, IProps, ITripTags } from './types'
import TripsTypes from '../TripsType'
import './styles.scss'
export default class Slider extends Component<IProps, State> {
  state = {
    tripName: []
  }

  render() {
    let { tripTags } = this.props

    return (
      <div className="trips" >
        {tripTags.length && tripTags.length !==0  ?
          <>
            <div className="trips-content" >
              {tripTags.map((tag: ITripTags) => {
                return (
                  <TripsTypes
                    key={tag.tag}
                    tripTag={tag}
                    selectTripTag={this.props.selectTripTag}
                  />
                )
              })}
            </div>
            <div className="trips-foter">
              <div className="trips-foter-clear" onClick={() => this.props.applyTripTagFilter(false)}>CLEAR</div>
              <div className="trips-foter-aplly" onClick={() => this.props.applyTripTagFilter(true)}>APPLY FILTERS</div>
            </div>
          </>

          : <div className="trips-foter">
             <div className="trips-foter-clear">No tags</div>
            </div>}


      </div>)
  }
}