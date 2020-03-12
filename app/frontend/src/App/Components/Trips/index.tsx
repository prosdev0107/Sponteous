import React, { Component } from 'react'
import { State, IProps, ITripTags } from './types'
import TripsTypes from '../TripsType'
import './styles.scss'
export default class Trips extends Component<IProps, State> {
  render() {
    let { tripTags } = this.props

    return (
      <div className="trips">
        {tripTags.length && tripTags.length !== 0 ? (
          <>
            <div className="trips-content">
              {tripTags.map((tag: ITripTags) => {
                return (
                  <TripsTypes
                    key={tag.tag}
                    tripTag={tag}
                    selectTripTag={this.props.selectTripTag}
                    tripsVisible={this.props.tripsVisible}
                    applyTripTagFilter={this.props.applyTripTagFilter}
                  />
                )
              })}
            </div>
            <div className="trips-foter">
              {tripTags.some((e: any) => e.active === true) ? (
                <div
                  className="trips-foter-clear"
                  onClick={() => this.props.applyTripTagFilter(false)}>
                  CLEAR
                </div>
              ) : (
                <div />
              )}
              {/* <div className="trips-foter-aplly" onClick={() => (this.props.applyTripTagFilter(true),this.props.tripsVisible())}>APPLY FILTERS</div> */}
            </div>
          </>
        ) : (
          <div className="trips-foter">
            <div className="trips-foter-clear">No tags</div>
          </div>
        )}
      </div>
    )
  }
}
