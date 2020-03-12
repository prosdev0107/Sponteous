import React, { Component } from 'react'
import selected from '../../Utils/Media/selected.png'
import { State, IProps } from './types'
import './styles.scss'
export default class Trips extends Component<IProps, State> {
  state = {}
  render() {
    const { tripTag } = this.props
    return (
      <div className="trip-type">
        <div className="trip-type-select">
          <div
            className="trip-type-select-checkBox"
            onClick={() => {
              this.props.selectTripTag(tripTag)
              this.props.applyTripTagFilter(true)
            }}>
            {tripTag.active ? <img src={selected} /> : ''}
          </div>
          <div className="trip-type-select-trip">{tripTag.tag}</div>
        </div>
      </div>
    )
  }
}
