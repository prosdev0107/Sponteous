import React, { Component } from 'react'
import * as moment from 'moment'
import { IDuration } from '../../../Common/Utils/globalTypes'
import 'moment-duration-format'

import Calendar from '../Calenadar'
import Button from '../../../Common/Components/Button'
import Dropdown from '../Dropdown'

import { IProps, IState } from './types'
import './styles.scss'
import { ITicket } from '../../../Common/Utils/globalTypes'
import {
  ISelectedData,
  ITrip as ITripSelect
} from '../../../App/Utils/appTypes'
import { IOption } from '../Dropdown/types'

import messageInfo from '../../../Common/Utils/Media/message-info.svg'

export default class Destination extends Component<IProps, IState> {
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
    endDates: []
  }
  node = React.createRef<HTMLDivElement>()

  componentDidMount() {
    this.setState({ calendar: this.props.isCalendarOpen })
    document.addEventListener('mousedown', this.handleClickOutside, false)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside, false)
  }

  handleClickOutside = (e: any) => {
    if (this.node.current && this.state.calendar && !this.props.isMapViewOn) {
      if (!this.node.current.contains(e.target)) {
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
    this.state.hoursToSelect.start.sort(
      (a, b) => parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0])
    )
    this.state.hoursToSelect.end.sort(
      (a, b) => parseInt(a.name.split(':')[0]) - parseInt(b.name.split(':')[0])
    )

    const { data, quantity } = this.props
    const HOURS_SET_PRICE = process.env.REACT_APP_TICKET_CHOOSE_TIME_PRICE

    const tmpDate = new Date(new Date().setHours(0, 0, 0, 0))

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

    return (
      <div className="destination-calendar">
        <Calendar
          selectRange
          startDates={startDates}
          endDates={endDates}
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

        <div className="destination-calendar-bottom">
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
      }
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
          childPrice: data['destinationCharges'].childPrice || 0
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

  render() {
    const { selected, deselect, data } = this.props
    const { discount, duration, destination, typeOfTransport } = data
    const { calendar, dates } = this.state
    let finalCost, strippedCost

    if (data['destinationCharges']) {
      finalCost =
        data['destinationCharges'].adultPrice * this.props.data['Adult'] +
        data['destinationCharges'].childPrice * this.props.data['Youth'] +
        (data.adultPrice * this.props.data['Adult'] +
          data.childPrice * this.props.data['Youth'])
      strippedCost = (
        data['destinationCharges'].adultPrice * this.props.data['Adult'] +
        data['destinationCharges'].childPrice * this.props.data['Youth'] +
        ((data.adultPrice / (1 - data.discount / 100)) *
          this.props.data['Adult'] +
          (data.childPrice / (1 - data.discount / 100)) *
            this.props.data['Youth'])
      ).toFixed(0)
    } else {
      finalCost =
        2 *
        (data.adultPrice * this.props.data['Adult'] +
          data.childPrice * this.props.data['Youth'])
      strippedCost = (
        2 *
        ((data.adultPrice / (1 - data.discount / 100)) *
          this.props.data['Adult'] +
          (data.childPrice / (1 - data.discount / 100)) *
            this.props.data['Youth'])
      ).toFixed(0)
    }

    // Check hurry-up message based on ticket counts

    const { tickets } = this.props.data as ITripSelect

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

    let isThree = ticketLessThanThree.length >= 3
    let isFive =
      ticketLessThanFive.length / tickets.length >= 0.8 &&
      this.props.data['Adult'] + this.props.data['Youth'] < 5

    const durationTime = moment.duration({ minutes: duration }) as IDuration
    const formatedDuration = durationTime.format('h[h] m[m]')

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    return (
      <div
        className={`destination ${calendar ? 'overlay' : ''} ${
          !selected && isMobile ? 'destination-when-not-selected' : ''
        }`}
        ref={this.node}>
        <div
          className={`destination-top ${selected || deselect ? 'short' : ''}  ${
            calendar
              ? 'shortest'
              : isThree || (isFive && !selected)
                ? 'medium'
                : ''
          }`}>
          <div>{`SAVE ${discount}%`}</div>
          <img
            src={destination.photo}
            alt="bg"
            style={{
              minHeight: '18rem',
              maxHeight: '18rem'
            }}
          />
        </div>
        <div className="destination-bottom">
          {!calendar &&
            (isThree || isFive) &&
            !selected && (
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
                {isFive && (
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
            <span className="destination-bottom-price--stripped">{`£ ${strippedCost}`}</span>
            <span className="destination-bottom-price--final">{` £ ${finalCost}${' '}`}</span>
            {`/${' '}${
              this.props.data['Adult'] + this.props.data['Youth'] > 1
                ? `${this.props.data['Adult'] +
                    this.props.data['Youth']} passengers`
                : ' passenger'
            }`}
          </div>
          {calendar && <this.CalendarBlock />}
          {!selected &&
            !deselect && (
              <Button
                text="SELECT THIS TRIP"
                icon="plus"
                variant="blue"
                disabled={this.props.isMax}
                onClick={this.openCalendar}
              />
            )}
          {selected &&
            !deselect && (
              <>
                <Button
                  text={`selected for ${moment(
                    dates.start
                      ? dates.start
                      : (data as ISelectedData).dateStart
                  ).format('DD MMM')} - ${moment(
                    dates.end ? dates.end : (data as ISelectedData).dateEnd
                  ).format('DD MMM')}`}
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
          {!selected &&
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
