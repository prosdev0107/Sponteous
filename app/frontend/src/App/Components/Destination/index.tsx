import React, { Component } from 'react'
import * as moment from 'moment'
import { IDuration } from '../../../Common/Utils/globalTypes'
import 'moment-duration-format'
import { IStore } from '../../../Common/Redux/types'
import { connect } from 'react-redux'
import { selectSelected } from '../../../Common/Redux/Services/trips'
import { isMobileOnly } from 'react-device-detect'

import Calendar from '../Calenadar'
import Button from '../../../Common/Components/Button'
import Dropdown from '../Dropdown'

import { IProps, IState } from './types'
import './styles.scss'
import { ITicket } from '../../../Common/Utils/globalTypes'
import { getFromLS } from '../../../Common/Utils/helpers'
import {
  ISelectedData,
  ITrip as ITripSelect
} from '../../../App/Utils/appTypes'
import { IOption } from '../Dropdown/types'

import messageInfo from '../../../Common/Utils/Media/message-info.svg'

class Destination extends Component<IProps, IState> {
  readonly state: IState = {
    calendar: false,
    error: {
      state: false,
      msg: ''
    },
    dates: {
      start: null,
      end: null
    },
    hours: {
      start: null,
      end: null
    },
    hoursToSelect: {
      start: [],
      end: []
    },
    startDates: [],
    endDates: [],
    firstDate: {
      start: null,
      end: null
    },
    secondDate: {
      start: null,
      end: null
    },
    DateRadio: '',
    gdprUpdated: false,
  }
  node = React.createRef<HTMLDivElement>()

  componentDidMount() {
    this.setState({ calendar: this.props.isCalendarOpen })
    document.addEventListener('mousedown', this.handleClickOutside, false)

    const { data, quantity } = this.props
    const tmpDate = new Date(new Date().setHours(0, 0, 0, 0))
    if (data.type === 'trip' && data.tickets !== undefined) {
      const startDates =
        data.type === 'trip'
          ? data.tickets
            .filter(
              (item: ITicket) =>
                item.departure === data.departure.name &&
                item.destination === data.destination.name &&
                moment
                  .utc(item.date.start)
                  .set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
                  .isAfter(
                    tmpDate.getFullYear() +
                    '-' +
                    (tmpDate.getMonth() + 1).toString().padStart(2, '0') +
                    '-' +
                    tmpDate
                      .getDate()
                      .toString()
                      .padStart(2, '0')
                  ) &&
                item.adultPrice + item.childPrice >=
                quantity!.Adult + quantity!.Youth
            )
            .map((item: ITicket) =>
              moment.utc(item.date.start).format('YYYY-MM-DD')
            )
            .filter((item, index, array) => array.indexOf(item) === index)
          : []
      const endDates =
        data.type === 'trip'
          ? data.tickets
            .filter(
              (item: ITicket) =>
                item.departure === data.destination.name &&
                item.destination === data.departure.name &&
                moment
                  .utc(item.date.start)
                  .set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
                  .isAfter(
                    tmpDate.getFullYear() +
                    '-' +
                    (tmpDate.getMonth() + 1).toString().padStart(2, '0') +
                    '-' +
                    tmpDate
                      .getDate()
                      .toString()
                      .padStart(2, '0')
                  ) &&
                item.adultPrice + item.childPrice >=
                quantity!.Adult + quantity!.Youth
            )
            .map((item: ITicket) =>
              moment.utc(item.date.start).format('YYYY-MM-DD')
            )
            .filter((item, index, array) => array.indexOf(item) === index)
          : []

      this.setState({
        startDates,
        endDates
      })
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside, false)
  }

  handleClickOutside = (e: any) => {
    this.setState({ gdprUpdated: true })
    if (this.node.current && this.state.calendar && !this.props.isMapViewOn) {
      if (!this.node.current.contains(e.target)) {
        if (isMobileOnly) return;
        this.deselect()
      }
    }
  }

  CalendarBlock = () => {
    const {
      error,
      hours,
      hoursToSelect: { start, end }
    } = this.state
    const { selected } = this.props
    this.state.hoursToSelect.start.sort(
      (a, b) => parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0])
    )
    this.state.hoursToSelect.end.sort(
      (a, b) => parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0])
    )

    const HOURS_SET_PRICE = process.env.REACT_APP_TICKET_CHOOSE_TIME_PRICE
    const uniqueAvailableLength =
      selected.length === 0
        ? -1
        : selected
          .reduce((unique: ISelectedData[], other: any) => {
            if (
              !unique.some(
                (item: any) =>
                  item.dateStart === other.dateStart &&
                  item.dateEnd === other.dateEnd
              )
            ) {
              unique.push(other)
            }
            return unique
          }, [])
          .filter(item => {
            const { startDates, endDates } = this.state
            const dateStartString = moment
              .utc(item.dateStart)
              .format('YYYY-MM-DD')
            const dateEndString = moment
              .utc(item.dateEnd)
              .format('YYYY-MM-DD')
            if (startDates && endDates) {
              return (
                startDates.includes(dateStartString) &&
                endDates.includes(dateEndString)
              )
            }
            return false
          }).length
    return (
      <div className={`destination-calendar calendar-${uniqueAvailableLength}`}>
        <Calendar
          selectRange
          startDates={this.state.startDates}
          endDates={this.state.endDates}
          onChange={this.handleSelectDates}
        />

        {error.state ? (
          <div className="destination-calendar-error">{error.msg}</div>
        ) : null}

        {start.length > 0 && end.length > 0 ? (
          <div className="destination-calendar-dropdowns">
            <p className="heading">
              You can select trip hours for extra price (+ £{HOURS_SET_PRICE})
            </p>
            <Dropdown
              label="Departure hours"
              id="start"
              placeholder="Select"
              options={start}
              selectedValue={hours.start!}
              onChange={this.handleSelectHour}
            />

            <Dropdown
              label="Return hours"
              id="end"
              placeholder="Select"
              options={end}
              selectedValue={hours.end!}
              onChange={this.handleSelectHour}
            />
          </div>
        ) : null}

        <div className='destination-calendar-bottom'>
          <Button text="select" onClick={this.select} variant="blue-select" />
          <Button
            text="clear dates"
            variant="gray"
            icon="cross"
            onClick={this.deselect}
          />
        </div>
      </div>
    )
  }

  setInitialState = () => {
    this.setState({
      calendar: false,
      dates: {
        start: null,
        end: null
      },
      hours: {
        start: null,
        end: null
      },
      hoursToSelect: {
        start: [],
        end: []
      },
      DateRadio: ''
    })
  }

  setError = (msg: string) => {
    this.setState(
      {
        error: { state: true, msg }
      },
      () =>
        setTimeout(() => {
          this.setState({ error: { state: false, msg: '' } })
        }, 5000)
    )
  }

  clickPickDate() {
    this.setState({
      DateRadio: 'pickDate-1'
    })
  }

  select = () => {
    const { dates, hours } = this.state
    const { onSelect } = this.props
    const data = this.props.data as ITripSelect
    const offset = moment(dates.start!).utcOffset()

    if (dates.start && dates.end) {
      const selectedData: ISelectedData = {
        tripId: data._id,
        _id: data._id,
        deselectionPrice: data.deselectionPrice,
        discount: data.discount,
        duration: data.duration,
        photo: data.destination.photo || '',
        adultPrice: data.adultPrice,
        childPrice: data.childPrice,
        departure: data.departure,
        destination: data.destination,
        typeOfTransport: data.typeOfTransport,
        type: 'selectedTrid',
        dateStart: +moment.utc(dates.start).add(offset, 'minutes'),
        destinationCharges: {
          adultPrice: data['destinationCharges'].adultPrice || 0,
          childPrice: data['destinationCharges'].childPrice || 0,
          discount: data['destinationCharges'].discount || 0
        },
        dateEnd: +moment
          .utc(dates.end)
          .add(offset, 'minutes')
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      }

      if (hours.start && hours.end) {
        selectedData.arrivalTicket = hours.start.id
        selectedData.departureTicket = hours.end.id
      }

      onSelect && onSelect(selectedData)
      this.closeCalendar()
    } else {
      this.setError('You need to select start and end dates')
    }
  }

  deselect = () => {
    const { data } = this.props
    if (data.type === 'selectedTrid') {
      this.props.onDeselect && this.props.onDeselect(data)
    } else {
      console.log(this.props)
      this.props.onDeselect &&
        this.props.onDeselect(this.props.index || data._id)
    }

    this.setInitialState()
    this.closeCalendar()
  }

  openCalendar = () => {
    const { onCalendarOpen } = this.props
    onCalendarOpen && onCalendarOpen()
    this.setState({ calendar: true })
  }

  closeCalendar = () => {
    const { onCalendarClose } = this.props
    onCalendarClose && onCalendarClose()
    this.setState({ calendar: false })
  }

  handleSelectDates = (dates: [Date, Date]) => {
    const { tickets, departure, destination } = this.props.data as ITripSelect
    const offset = moment(dates[0]).utcOffset()

    const hours = tickets.reduce(
      (total, ticket: ITicket) => {
        const isStartSameFirst = moment(
          moment.utc(ticket.date.start).format('YYYY-MM-DD')
        ).isSame(
          moment
            .utc(dates[0])
            .add(offset, 'minutes')
            .format('YYYY-MM-DD')
        )

        const isStartSameSecond = moment(
          moment.utc(ticket.date.start).format('YYYY-MM-DD')
        ).isSame(
          moment
            .utc(dates[1])
            .add(offset, 'minutes')
            .format('YYYY-MM-DD')
        )

        if (
          ticket.departure === departure.name &&
          ticket.destination === destination.name &&
          isStartSameFirst
        ) {
          total.start.push({
            id: ticket._id,
            name: `${moment
              .utc(ticket.date.start)
              .format('HH:mm')} - ${moment
                .utc(ticket.date.end)
                .format('HH:mm')}`
          })
        } else if (
          ticket.departure === destination.name &&
          ticket.destination === departure.name &&
          isStartSameSecond
        ) {
          total.end.push({
            id: ticket._id,
            name: `${moment
              .utc(ticket.date.start)
              .format('HH:mm')} - ${moment
                .utc(ticket.date.end)
                .format('HH:mm')}`
          })
        }
        return total
      },
      { start: [], end: [] } as { start: IOption[]; end: IOption[] }
    )

    if (this.isSameDateAs(dates[0], dates[1])) {
      for (var i = 0; i < hours.start.length; i++) {
        const a = hours.start[i].name.split(' - ')[0].split(':')[0]
        const indx = hours.end.indexOf(
          hours.end.filter(
            x => parseInt(x.name.split(' - ')[0].split(':')[0]) >= parseInt(a)
          )[0]
        )
        if (indx == -1) {
          const rmvbleIndx = hours.start.indexOf(hours.start[i])
          hours.start.splice(rmvbleIndx, 1)
        }
      }
    }

    this.setState({
      dates: {
        start: dates[0],
        end: dates[1]
      },
      hours: {
        start: null,
        end: null
      },
      hoursToSelect: {
        start: hours.start,
        end: hours.end
      }
    })
  }

  isSameDateAs = (a: any, b: any) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  handleSelectHour = (data: {
    id: string
    value: { id: string; name: string }
  }) => {
    this.setState((state: IState) => ({
      hours: {
        ...state.hours,
        [data.id]: data.value
      }
    }))
  }
  getPrice = (start: number, end: number) => {
    let startDate = moment.utc(start).format('YYYY-MM-DD')
    let endDate = moment.utc(end).format('YYYY-MM-DD')
    const { tickets } = this.props.data as ITripSelect
    const { departure, destination } = this.props.data
    let startDateFilteredTickets = tickets.filter(item => {
      let itemStartDate = moment.utc(item.date.start).format('YYYY-MM-DD')
      return startDate === itemStartDate && departure.name === item.departure
    })
    let endDateFilteredTickets = tickets.filter(item => {
      let itemEndDate = moment.utc(item.date.end).format('YYYY-MM-DD')
      return endDate === itemEndDate && destination.name === item.departure
    })
    let startCosts = [],
      endCosts = []
    for (const item of startDateFilteredTickets) {
      let cost =
        item.adultPrice * this.props.data['Adult'] +
        item.childPrice * this.props.data['Youth']
      startCosts.push(cost)
    }
    for (const item of endDateFilteredTickets) {
      let cost =
        item.adultPrice * this.props.data['Adult'] +
        item.childPrice * this.props.data['Youth']
      endCosts.push(cost)
    }
    let finalCost = Math.max(...startCosts) + Math.max(...endCosts)
    return finalCost
  }

  render() {
    const { isSelected, deselect, data, selected } = this.props
    const { duration, destination, typeOfTransport } = data
    const { calendar, dates } = this.state
    let finalCost, strippedCost
    let discount = data.discount
    if (data['destinationCharges']) {
      finalCost =
        data['destinationCharges'].adultPrice * this.props.data['Adult'] +
        data['destinationCharges'].childPrice * this.props.data['Youth'] +
        (data.adultPrice * this.props.data['Adult'] +
          data.childPrice * this.props.data['Youth'])
      strippedCost =
        (data['destinationCharges'].adultPrice /
          (1 - data['destinationCharges'].discount / 100)) *
        this.props.data['Adult'] +
        (data['destinationCharges'].childPrice /
          (1 - data['destinationCharges'].discount / 100)) *
        this.props.data['Youth'] +
        ((data.adultPrice / (1 - data.discount / 100)) *
          this.props.data['Adult'] +
          (data.childPrice / (1 - data.discount / 100)) *
          this.props.data['Youth'])
      discount = (1 - finalCost / strippedCost) * 100
    } else {
      finalCost =
        2 *
        (data.adultPrice * this.props.data['Adult'] +
          data.childPrice * this.props.data['Youth'])
      strippedCost =
        2 *
        ((data.adultPrice / (1 - data.discount / 100)) *
          this.props.data['Adult'] +
          (data.childPrice / (1 - data.discount / 100)) *
          this.props.data['Youth'])
    }

    // Check hurry-up message based on ticket counts

    let isThree = false,
      isFive = false
    const { tickets } = this.props.data as ITripSelect

    if (tickets) {
      const ticketLessThanThree = tickets.filter(ticket => {
        let availableTicket =
          ticket.quantity - ticket.soldTickets - ticket.reservedQuantity
        return availableTicket <= 3
      })

      const ticketLessThanFive = tickets.filter(ticket => {
        let availableTicket =
          ticket.quantity - ticket.soldTickets - ticket.reservedQuantity
        return availableTicket <= 5
      })

      isThree =
        ticketLessThanThree.length >= 3 &&
        this.props.data['Adult'] + this.props.data['Youth'] <= 3
      isFive =
        ticketLessThanFive.length / tickets.length >= 0.8 &&
        this.props.data['Adult'] + this.props.data['Youth'] <= 5
    }

    const isGDPR = getFromLS('gdpr')
    const durationTime = moment.duration({ minutes: duration }) as IDuration
    const formatedDuration = durationTime.format('h[h] m[m]')

    const uniqueAvailableLength =
      selected.length === 0
        ? -1
        : selected
          .reduce((unique: ISelectedData[], other: any) => {
            if (
              !unique.some(
                (item: any) =>
                  item.dateStart === other.dateStart &&
                  item.dateEnd === other.dateEnd
              )
            ) {
              unique.push(other)
            }
            return unique
          }, [])
          .filter(item => {
            const { startDates, endDates } = this.state
            const dateStartString = moment
              .utc(item.dateStart)
              .format('YYYY-MM-DD')
            const dateEndString = moment
              .utc(item.dateEnd)
              .format('YYYY-MM-DD')
            if (startDates && endDates) {
              return (
                startDates.includes(dateStartString) &&
                endDates.includes(dateEndString)
              )
            }
            return false
          }).length

    return (
      <div
        className={`destination ${
          calendar
            ? !isMobileOnly
              ? 'overlay'
              : !this.props.isMapViewOn
                ? isGDPR ? 'mobile' : 'mobile gdpr'
                : ''
            : ''
          } ${
          !isSelected && isMobileOnly ? 'destination-when-not-selected' : ''
          }`}
        ref={this.node}>
        <div
          className={`destination-top ${
            isSelected || deselect ? 'short' : ''
            }  ${
            calendar
              ? 'shortest'
              : isThree || (isFive && !isSelected)
                ? 'medium'
                : ''
            }`}
          style={{ backgroundImage: `url(${destination.photo})` }}>
          {isMobileOnly &&
            calendar && (
              <div
                className="destination-close-mobile"
                onClick={this.closeCalendar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
                  <g fill="none" stroke="#4142A6">
                    <path strokeWidth="1" d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z" />
                  </g>
                </svg>
              </div>
            )}
          <div className="badge">{`SAVE ${discount.toFixed(0)}%`}</div>
          {/* <img
            src={destination.photo}
            alt="bg"
            style={{
              minHeight: '18rem',
              maxHeight: '18rem'
            }}
          /> */}
        </div>
        <div className={`destination-bottom ${calendar ? 'opened' : ''}`}>
          {!calendar &&
            (isThree || isFive) &&
            !isSelected && (
              <div className="destination-hurry-up-message">
                <img
                  src={messageInfo}
                  alt=""
                  srcSet=""
                  width="15px"
                  height="15px"
                />

                {isThree && (
                  <div className="destination-hurry-up-message-text">
                    Some{' '}
                    {typeOfTransport === 'Direct Flight'
                      ? 'flight'
                      : 'departure'}
                    s have no more than 3 seats available
                  </div>
                )}
                {!isThree &&
                  isFive && (
                    <div className="destination-hurry-up-message-text">
                      Less than 5 tickets per{' '}
                      {typeOfTransport === 'Direct Flight'
                        ? 'flight'
                        : 'departure'}
                      !
                    </div>
                  )}
              </div>
            )}
          <div className="destination-bottom-row">
            {!deselect && (
              <div destination-bottom-types>
                {
                  <div
                    className={`destination-bottom-type ${
                      typeOfTransport === 'Train'
                        ? 'destination-bottom-type--train'
                        : typeOfTransport === 'Bus'
                          ? 'destination-bottom-type--bus'
                          : typeOfTransport === 'Direct Flight'
                            ? 'destination-bottom-type--flight'
                            : 'destination-bottom-type--red'
                      }`}
                    style={{
                      borderColor: '#12b459',
                      color: '#12b459'
                    }}>
                    {typeOfTransport}
                  </div>
                }
              </div>
            )}
            {deselect && (
              <div destination-bottom-types>
                {
                  <span
                    className={`destination-bottom-type ${
                      typeOfTransport === 'Train'
                        ? 'destination-bottom-type--train'
                        : typeOfTransport === 'Bus'
                          ? 'destination-bottom-type--bus'
                          : typeOfTransport === 'Direct Flight'
                            ? 'destination-bottom-type--flight'
                            : 'destination-bottom-type--red'
                      }`}
                    style={{
                      borderColor: '#12b459',
                      color: '#12b459'
                    }}>
                    {typeOfTransport}
                  </span>
                }
              </div>
            )}
            <p className="destination-bottom-duration">
              approx. {formatedDuration}
            </p>
          </div>

          <p className="destination-bottom-title">{`${
            this.props.data.destination.name
            }`}</p>
          <p className="destination-bottom-luggage">Luggage included</p>
          <div className="destination-bottom-price">
            From{' '}
            <span className="destination-bottom-price--stripped">{`£ ${strippedCost.toFixed(
              0
            )}`}</span>
            <span className="destination-bottom-price--final">{` £ ${finalCost}${' '}`}</span>
            {`/${' '}${
              this.props.data['Adult'] + this.props.data['Youth'] > 1
                ? `${this.props.data['Adult'] +
                this.props.data['Youth']} passengers`
                : ' passenger'
              }`}
          </div>
          {calendar &&
            selected.length >= 1 && (
              <div className="destination-bottom-travel-dates">
                <p className="destination-bottom-travel-dates-title">
                  Choose your travel dates:
                </p>
                {selected
                  .reduce((unique: ISelectedData[], other: any) => {
                    if (
                      !unique.some(
                        (item: any) =>
                          item.dateStart === other.dateStart &&
                          item.dateEnd === other.dateEnd
                      )
                    ) {
                      unique.push(other)
                    }
                    return unique
                  }, [])
                  .filter(item => {
                    const { startDates, endDates } = this.state
                    const dateStartString = moment
                      .utc(item.dateStart)
                      .format('YYYY-MM-DD')
                    const dateEndString = moment
                      .utc(item.dateEnd)
                      .format('YYYY-MM-DD')
                    if (startDates && endDates) {
                      return (
                        startDates.includes(dateStartString) &&
                        endDates.includes(dateEndString)
                      )
                    }
                    return false
                  })
                  .map((item, index) => {
                    return (
                      <div
                        key={index}
                        className={`destination-bottom-travel-dates-block ${
                          this.state.DateRadio === index + '' ? 'selected' : ''
                          }`}>
                        <input
                          type="radio"
                          name="radio-group"
                          id={`radio${index}_${this.props.data._id}`}
                          value={index}
                          checked={this.state.DateRadio === index + ''}
                          onChange={e => {
                            this.setState({ DateRadio: e.target.value })
                            this.handleSelectDates([
                              new Date(
                                moment
                                  .utc(item.dateStart)
                                  .format('DD MMM YYYY HH:mm:ss')
                              ),
                              new Date(
                                moment
                                  .utc(item.dateEnd)
                                  .format('DD MMM YYYY HH:mm:ss')
                              )
                            ])
                          }}
                        />
                        <label htmlFor={`radio${index}_${this.props.data._id}`}>
                          {moment.utc(item.dateStart).format('DD MMM')} -
                          {moment.utc(item.dateEnd).format('DD MMM')}
                          <span className="destination-bottom-duration">
                            £ {this.getPrice(item.dateStart, item.dateEnd)}{' '}
                            {`/${' '}${
                              this.props.data['Adult'] +
                                this.props.data['Youth'] >
                                1
                                ? `${this.props.data['Adult'] +
                                this.props.data['Youth']} passengers`
                                : ' passenger'
                              }`}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                <div
                  className={`destination-bottom-travel-dates-block ${
                    this.state.DateRadio === 'pickDate' ? 'selected' : ''
                    }`}>
                  <input
                    type="radio"
                    name="radio-group"
                    id={`pickradio_${this.props.data._id}`}
                    value="pickDate"
                    checked={this.state.DateRadio === 'pickDate'}
                    onChange={e => this.setState({ DateRadio: e.target.value })}
                  />
                  <label htmlFor={`pickradio_${this.props.data._id}`}>
                    PICK DATES ON THE CALENDAR
                  </label>
                </div>
              </div>
            )}
          {calendar && selected.length >= 1 && this.state.DateRadio !== 'pickDate' &&
            <div className="destination-pick-calendar-wrapper">
              <div
                className={this.state.DateRadio === 'pickDate-1' ? '' : "destination-pick-calendar"}
                onClick={() => this.clickPickDate()}
              >
                <this.CalendarBlock />
              </div>
            </div>}
          {calendar &&
            ((selected.length >= 1 && this.state.DateRadio === 'pickDate') ||
              selected.length < 1) && <this.CalendarBlock />}
          {!isSelected &&
            !deselect &&
            (!calendar ? (
              <Button
                text="SELECT THIS TRIP"
                icon="plus"
                variant="blue"
                disabled={this.props.isMax}
                onClick={this.openCalendar}
              />
            ) : selected.length >= 1 && this.state.DateRadio !== 'pickDate' && this.state.DateRadio !== 'pickDate-1' ? (
              <div
                className={`destination-calendar calendar-bottom-${uniqueAvailableLength}`}>
                <div className='destination-calendar-bottom'>
                  <Button
                    text="select"
                    onClick={this.select}
                    variant="blue-select"
                  />
                  <Button
                    text="clear dates"
                    variant="gray"
                    icon="cross"
                    onClick={this.deselect}
                  />
                </div>
              </div>
            ) : (
                  ''
                ))}
          {isSelected &&
            !deselect && (
              <>
                <Button
                  text={`selected for ${
                    dates.start
                      ? moment(dates.start).format('DD MMM')
                      : moment
                        .utc((data as ISelectedData).dateStart)
                        .format('DD MMM')
                    } - ${
                    dates.end
                      ? moment(dates.end).format('DD MMM')
                      : moment
                        .utc((data as ISelectedData).dateEnd)
                        .format('DD MMM')
                    }`}
                  variant="green"
                />
                <Button
                  text="clear dates"
                  variant="gray"
                  icon="cross"
                  onClick={this.deselect}
                />
              </>
            )}
          {!isSelected &&
            deselect &&
            data.type === 'selectedTrid' && (
              <>
                <Button
                  text={`selected for ${moment
                    .utc(data.dateStart)
                    .format('DD MMM')} - ${moment
                      .utc(data.dateEnd)
                      .format('DD MMM')}`}
                />
                <Button
                  text={`delete for £ ${data.deselectionPrice}`}
                  variant="red"
                  icon="crossWhite"
                  onClick={this.deselect}
                  disabled={this.props.isMax}
                />
              </>
            )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state: IStore) => ({
  selected: selectSelected(state)
})

export default connect(
  mapStateToProps,
  {}
)(Destination)
