import React, { Component } from 'react'
import { connect } from 'react-redux'

import MainBlock from '../../Components/MainBlock'
import Steps from '../../Components/Steps'
import Destination from '../../Components/Destination'
import SelectPanel from '../../Components/SelectPanel'
import Button from '../../../Common/Components/Button'
import Title from '../../Components/Title'

import withToast from '../../../Common/HOC/withToast'
import { compose } from '../../../Common/HOC/compose'
import { IStore } from '../../../Common/Redux/types'
import {
  selectSelected,
  selectIsMaxDeselected,
  selectDeselected,
  clearDeselected,
  addDeselected
} from '../../../Common/Redux/Services/trips'

import {
  getFromLS,
  removeFromLS,
  saveToLS,
  getOwnerToken
} from '../../../Common/Utils/helpers'
import { unbookTrips } from '../../Utils/api'
import { ISelectedData } from '../../Utils/appTypes'
import { STEP_IDS } from '../../Utils/constants'
import { RouteComponentProps } from 'react-router-dom'
import { IProps, IState } from './types'
import './styles.scss'

const MAX = 3

class DeselectContainer extends Component<
  RouteComponentProps<{}> & IProps,
  IState
  > {

  componentDidMount() {
    window.scrollTo(0, 0)
    const owner = getFromLS('owner')

    if (!owner || !owner.token) {
      this.props.history.push('/')
    }

    removeFromLS('owner')
    saveToLS('ownerTemp', owner)
  }


  onDeselect = (deselectedItem: ISelectedData) => {
    const owner = getFromLS('ownerTemp')
    const { isMax, addDeselected } = this.props
    if (isMax) {
      return
    }

    if (owner) {
      const newLSData = {
        ...owner,
        token: owner.token,
        data: {
          ...owner.data,
          deselected: !owner.data.deselected
            ? [deselectedItem]
            : [...owner.data.deselected, deselectedItem]
        }
      }

      saveToLS('owner', newLSData)
    }
    addDeselected(deselectedItem)
  }

  onClear = () => {
    const owner = getFromLS('ownerTemp')

    if (owner) {
      const newLSData = {
        ...owner,
        token: owner.token,
        data: {
          ...owner.data,
          deselected: []
        }
      }

      saveToLS('owner', newLSData)
    }
    this.props.clearDeselected()
  }

  onNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    const owner = getFromLS('ownerTemp')
    removeFromLS('ownerTemp')
    saveToLS('owner', owner)
    e.preventDefault()
    const token = getOwnerToken()
    const deselectedTripsId = this.props.deselected.map(
      (deselected: ISelectedData) => deselected.tripId
    )

    if (deselectedTripsId.length) {
      const apiData = {
        owner: token,
        trips: deselectedTripsId
      }
      unbookTrips(apiData)
        .then(() => {
          this.props.history.push('/destinations/payment')
        })
        .catch(err => {
          this.props.showError(err)
        })
    } else {
      this.props.history.push('/destinations/payment')
    }
  }

  onBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    removeFromLS('ownerTemp')
    e.preventDefault()
    this.props.history.push('/destinations/select')
  }

  render() {
    const { selected, deselected, isMax } = this.props

    return (
      <section className="deselect-cnt">
          <MainBlock className="deselect-cnt-block">
            <Title
              text="Narrow down your selection"
              selected={['Narrow down']}
              className="deselect-title"
              desc="This is an optional step"
            />
          <Steps />
        </MainBlock>
        <div className="deselect-cnt-info">
          <p className="deselect-cnt-info-margin">
           Is <span>{`${selected.length} destinations`}</span> too much?<div className="deselect-cnt-info-normalBold">Narrow down your results and keep only your favorite ones.&thinsp;<div className="deselect-cnt-info-optional">(Optional step)</div></div>
          </p>
          {deselected.length > 0 && (
            <Button
              text="undo deselection"
              variant="gray"
              onClick={this.onClear}
              icon="undo"
              className="undo-deselection"
            />
          )}
        </div>
        <section className="deselect-cnt-destinations">
          {selected.map((item: ISelectedData) => {
            item.type = 'selectedTrid'
            const isSome = deselected.some(
              (deselected: ISelectedData) => deselected.tripId === item.tripId
            )

            return !isSome ? (
              <Destination
                index={item.tripId}
                key={item.tripId}
                data={item}
                onDeselect={this.onDeselect}
                isMax={isMax}
                deselect
                isCalendarOpen={false}
              />
            ) : null
          })}
        </section>

        <SelectPanel
          step={STEP_IDS.DESELECT}
          selected={selected}
          deselected={deselected}
          isMax={isMax}
          max={MAX}
          onNext={this.onNext}
          onBack={this.onBack}
        />
      </section>
    )
  }
}

const mapStateToProps = (state: IStore) => ({
  isMax: selectIsMaxDeselected(state),
  selected: selectSelected(state),
  deselected: selectDeselected(state)
})

const composeHOCs = compose(
  DeselectContainer,
  withToast
)

export default connect(
  mapStateToProps,
  { clearDeselected, addDeselected }
)(composeHOCs)
