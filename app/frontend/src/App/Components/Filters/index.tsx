import React from 'react'
import { Slider } from 'antd'
import arrow from '../../../Common/Utils/Media/arrow.svg'
import money from '../../Utils/Media/money.svg'
import calendar from '../../Utils/Media/calendar.svg'
import filterClose from '../../Utils/Media/filterClose.png'
import mapIcon from '../../Utils/Media/mapIcon.png'
import mapClose from '../../Utils/Media/mapClose.png'
import Trips from '../../Components/Trips'
import trip from '../../Utils/Media/tripTypeImage.svg'
import mapBackground from '../../Utils/Media/mapBackground.png'
import Calendar from '../Calenadar'
import { IProps, IState } from './types'
import './styles.scss'
import 'antd/lib/slider/style/index.css'
import { ITripTags } from '../Trips/types'

export default class Filters extends React.Component<IProps, IState> {
  readonly state: IState = {
    calendarVisible: false,
    calendarTouched: false,
    priceVisible: false,
    priceTouched: false,
    tripsVisible: false
  }

  setDepartureValue = ([start, end]: [Date, Date]) => {
    this.setState({ calendarTouched: true })
    this.props.onChange({ start, end }, () => {
      this.props.fetchTrips()
    })
  }

  setPriceValue = ([min, max]: [number, number]) => {
    this.setState({ priceTouched: true })
    this.props.onChange({ min, max })
  }

  setTripsValue = (tags: any) => {
    console.log('tags:', tags)
    // this.props.onChange(tags)
  }

  hanleToggleClendarVisible = () => {
    this.setState((state: IState) => ({
      calendarVisible: !state.calendarVisible,
      tripsVisible: false,
      priceVisible: false
    }))
  }

  hanleToggleTripsVisible = () => {
    this.setState((state: IState) => ({
      tripsVisible: !state.tripsVisible,
      calendarVisible: false,
      priceVisible: false
    }))
  }

  handleTogglePriceVisible = () => {
    this.setState((state: IState) => ({
      priceVisible: !state.priceVisible,
      calendarVisible: false,
      tripsVisible: false
    }))
  }

  handleClearFilters = () => {
    this.props.clearDates()
    this.props.clearPrice()
    this.props.clearTrips()
    this.setState({
      calendarVisible: false,
      calendarTouched: false,
      priceVisible: false,
      priceTouched: false,
      tripsVisible: false
    })
  }

  private createTripTitle = (tripTags: ITripTags[]): string => {
    let title: string = ''
    let isFirst: boolean = true
    if (tripTags.find((tag: ITripTags) => tag.active)) {
      tripTags.forEach((tag: ITripTags) => {
        if (tag.active) {
          if (isFirst) {
            title += tag.tag
            isFirst = false
          } else {
            if (title.indexOf(', ...') === -1) {
              ;(title + ', ' + tag.tag).length > 17
                ? (title += ', ...')
                : (title += ', ' + tag.tag)
            }
          }
        }
      })
    } else {
      title = 'Trip Type'
    }
    return title
  }

  render() {
    const {
      calendarVisible,
      priceVisible,
      priceTouched,
      tripsVisible
    } = this.state
    const {
      filters: { min, max, start, end },
      filterVisible,
      tripTags
    } = this.props

    const startText = start
      ? new Date(start!.getTime()).toDateString().replace(/(^\w+|\d+$)/g, '')
      : 'Departure'
    const endText = end
      ? new Date(end!.getTime()).toDateString().replace(/(^\w+|\d+$)/g, '')
      : 'Return'
    const priceText = priceTouched ? `${min} - ${max}` : 'Price'

    const tmpDate = new Date(new Date().setHours(0, 0, 0, 0))

    var startDate = new Date(
      tmpDate.getFullYear() +
        '-' +
        (tmpDate.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        tmpDate
          .getDate()
          .toString()
          .padStart(2, '0')
    )
    var endDate = new Date(
      tmpDate.getFullYear() +
        1 +
        '-' +
        (tmpDate.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        tmpDate
          .getDate()
          .toString()
          .padStart(2, '0')
    )
    var getDateArray = function(start: Date, end: Date) {
      var arr = new Array()
      var dt = new Date(start)
      while (dt <= end) {
        arr.push(new Date(dt))
        dt.setDate(dt.getDate() + 1)
      }
      return arr
    }
    let dateArray = getDateArray(startDate, endDate)
    let dates: string[] = []
    dateArray.map(date => {
      dates.push(
        date.getFullYear() +
          '-' +
          (date.getMonth() + 1).toString().padStart(2, '0') +
          '-' +
          date
            .getDate()
            .toString()
            .padStart(2, '0')
      )
    })

    if (this.props.isMapViewOn) {
      return (
        <div style={{ zIndex: 2, width: '100%' }}>
          <div className="map">
            <div className="map-filter">
              <button
                className="map-filter-btn"
                onClick={this.hanleToggleClendarVisible}>
                <div className="filters-inner">
                  <svg className="filters-filter-prefix">
                    <use xlinkHref={`${calendar}#svg`} />
                  </svg>
                  <span className="filters-filter-value">
                    {startText} - {endText}
                  </span>
                </div>
                <img
                  className={`filters-filter-suffix${
                    calendarVisible ? ' open' : ''
                  }`}
                  src={arrow}
                />
              </button>
              {calendarVisible && (
                <div className="filters-calendar">
                  <Calendar
                    startDates={dates}
                    endDates={dates}
                    onChange={this.setDepartureValue}
                    selectRange
                    value={[start as Date, end as Date]}
                  />
                  {this.state.calendarTouched && (
                    <div
                      className="filters-clearbtn"
                      onClick={() => {
                        this.props.clearDates()
                        this.setState({
                          calendarTouched: false
                        })
                      }}>
                      CLEAR
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="map-filter">
              <button
                className="map-filter-btn"
                onClick={this.handleTogglePriceVisible}>
                <div className="filters-inner">
                  <span className="filters-filter-prefix">
                    <svg>
                      <use xlinkHref={`${money}#money`} />
                    </svg>
                  </span>
                  <span className="filters-filter-value">{priceText}</span>
                </div>
                <span
                  className={`filters-filter-suffix${
                    priceVisible ? ' open' : ''
                  }`}>
                  <img src={arrow} />
                </span>
              </button>
              {priceVisible && (
                <div style={{ marginBottom: '2rem' }}>
                  <Slider
                    className="filters-slider"
                    range
                    tipFormatter={null}
                    min={0}
                    max={300}
                    value={[min, max]}
                    onChange={(v: [number, number]) => this.setPriceValue(v)}
                    onAfterChange={this.props.fetchTrips}
                  />
                  {this.state.priceTouched && (
                    <div
                      className="filters-clearbtn"
                      onClick={() => {
                        this.props.clearPrice()
                        this.setState({
                          priceTouched: false
                        })
                      }}>
                      CLEAR
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="map-filter">
              <button
                className="map-filter-btn"
                onClick={this.hanleToggleTripsVisible}>
                <div className="filters-inner">
                  <svg className="filters-filter-prefix">
                    <use xlinkHref={`${trip}#svg`} />
                  </svg>
                  <span className="filters-filter-value">
                    {this.createTripTitle(tripTags)}
                  </span>
                </div>
                <img
                  className={`filters-filter-suffix${
                    tripsVisible ? ' open' : ''
                  }`}
                  src={arrow}
                />
              </button>
              {tripsVisible && (
                <div className="filters-trips">
                  <Trips
                    tripsVisible={this.hanleToggleTripsVisible}
                    tripTags={tripTags}
                    applyTripTagFilter={(applay: boolean) =>
                      this.props.applyTripTagFilter(applay)
                    }
                    selectTripTag={(tripTag: ITripTags) =>
                      this.props.selectTripTag(tripTag)
                    }
                  />
                </div>
              )}
            </div>
            <div className="map-filter">
              <button
                className="map-filter-btn"
                style={{
                  justifyContent: 'center'
                }}
                onClick={this.props.openMapView}>
                <div className="filters-inner">
                  <span className="filters-filter-prefix">
                    <img src={mapClose} width="15px" alt="" srcSet="" />
                  </span>
                  <span className="filters-filter-value">
                    <div style={{ fontWeight: 500 }}>
                      {this.props.isMapViewOn ? 'CLOSE MAP VIEW' : 'MAP VIEW'}
                    </div>
                  </span>
                </div>
              </button>
            </div>
          </div>
          {!filterVisible ? (
            <div className="filters-m">
              <div style={{ display: 'flex', padding: '0 10px' }}>
                <button
                  className="filters-filter"
                  style={{ width: '180px', marginRight: '10px' }}
                  onClick={this.props.hanleToggleFilterVisible}>
                  <div className="filters-inner">
                    <span className="filters-filter-value">Filters</span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      calendarVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                <button
                  className="filters-filter"
                  style={{
                    justifyContent: 'center'
                  }}
                  onClick={this.props.openMapView}>
                  <div className="filters-inner">
                    <span
                      className="filters-filter-prefix"
                      style={{ marginTop: '2px' }}>
                      <img src={mapClose} width="15px" alt="" srcSet="" />
                    </span>
                    <span className="filters-filter-value">
                      <div style={{ fontWeight: 500 }}>
                        {this.props.isMapViewOn ? 'CLOSE MAP VIEW' : 'MAP VIEW'}
                      </div>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="filters-m--open">
              <div className="filters-header">
                <button
                  onClick={this.props.hanleToggleFilterVisible}
                  className="filters-button">
                  <img src={filterClose} width="15px" alt="" srcSet="" />
                </button>
                <h5 className="filters-title">
                  Filters ({+priceTouched + +!!start + +this.props.tripsActive})
                </h5>

                <button
                  onClick={this.handleClearFilters}
                  className="filters-button">
                  Clear
                </button>
              </div>
              <div style={{ padding: '30px 20px' }}>
                <button
                  className="filters-filter"
                  onClick={this.hanleToggleClendarVisible}>
                  <div className="filters-inner">
                    <svg className="filters-filter-prefix">
                      <use xlinkHref={`${calendar}#svg`} />
                    </svg>
                    <span className="filters-filter-value">
                      {startText} - {endText}
                    </span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      calendarVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                {calendarVisible && (
                  <div className="filters-calendar">
                    <Calendar
                      startDates={dates}
                      endDates={dates}
                      onChange={this.setDepartureValue}
                      selectRange
                      value={[start as Date, end as Date]}
                    />
                    {this.state.calendarTouched && (
                      <div
                        className="filters-clearbtn"
                        onClick={() => {
                          this.props.clearDates()
                          this.setState({
                            calendarTouched: false
                          })
                        }}>
                        CLEAR
                      </div>
                    )}
                  </div>
                )}
                <button
                  className="filters-filter"
                  onClick={this.hanleToggleTripsVisible}>
                  <div className="filters-inner">
                    <svg className="filters-filter-prefix">
                      <use xlinkHref={`${trip}#svg`} />
                    </svg>
                    <span className="filters-filter-value">
                      {this.createTripTitle(tripTags)}
                    </span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      tripsVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                {tripsVisible && (
                  <div className="filters-trips">
                    <Trips
                      tripsVisible={this.hanleToggleTripsVisible}
                      tripTags={tripTags}
                      applyTripTagFilter={(applay: boolean) =>
                        this.props.applyTripTagFilter(applay)
                      }
                      selectTripTag={(tripTag: ITripTags) =>
                        this.props.selectTripTag(tripTag)
                      }
                    />
                  </div>
                )}
                <button
                  className="filters-filter"
                  onClick={this.handleTogglePriceVisible}>
                  <div className="filters-inner">
                    <span className="filters-filter-prefix">
                      <svg>
                        <use xlinkHref={`${money}#money`} />
                      </svg>
                    </span>
                    <span className="filters-filter-value">{priceText}</span>
                  </div>
                  <span
                    className={`filters-filter-suffix${
                      priceVisible ? ' open' : ''
                    }`}>
                    <img src={arrow} />
                  </span>
                </button>
                {priceVisible && (
                  <div style={{ marginBottom: '2rem' }}>
                    <Slider
                      className="filters-slider"
                      range
                      tipFormatter={null}
                      min={0}
                      max={300}
                      value={[min, max]}
                      onChange={(v: [number, number]) => this.setPriceValue(v)}
                      onAfterChange={this.props.fetchTrips}
                    />
                    {this.state.priceTouched && (
                      <div
                        className="filters-clearbtn"
                        onClick={() => {
                          this.props.clearPrice()
                          this.setState({
                            priceTouched: false
                          })
                        }}>
                        CLEAR
                      </div>
                    )}
                  </div>
                )}
                <button
                  className="filters-filter"
                  style={{
                    backgroundColor: '#5dc3fd',
                    color: 'white',
                    justifyContent: 'center'
                  }}
                  onClick={this.props.hanleToggleFilterVisible}>
                  <div className="filters-inner">
                    <div className="filters-filter-value">APPLY FILTERS</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div>
          <div className="filters">
            <div className="filters-header">
              <h5 className="filters-title">
                Filters ({+priceTouched + +!!start + +this.props.tripsActive})
              </h5>

              <button
                onClick={this.handleClearFilters}
                className="filters-button">
                Clear filters
              </button>
            </div>
            <button
              className="filters-filter"
              onClick={this.hanleToggleClendarVisible}>
              <div className="filters-inner">
                <svg className="filters-filter-prefix">
                  <use xlinkHref={`${calendar}#svg`} />
                </svg>
                <span className="filters-filter-value">
                  {startText} - {endText}
                </span>
              </div>
              <img
                className={`filters-filter-suffix${
                  calendarVisible ? ' open' : ''
                }`}
                src={arrow}
              />
            </button>
            {calendarVisible && (
              <div className="filters-calendar">
                <Calendar
                  startDates={dates}
                  endDates={dates}
                  onChange={this.setDepartureValue}
                  selectRange
                  value={[start as Date, end as Date]}
                />
                {this.state.calendarTouched && (
                  <div
                    className="filters-clearbtn"
                    onClick={() => {
                      this.props.clearDates()
                      this.setState({
                        calendarTouched: false
                      })
                    }}>
                    CLEAR
                  </div>
                )}
              </div>
            )}
            <button
              className="filters-filter"
              onClick={this.hanleToggleTripsVisible}>
              <div className="filters-inner">
                <svg className="filters-filter-prefix">
                  <use xlinkHref={`${trip}#svg`} />
                </svg>
                <span className="filters-filter-value">
                  {this.createTripTitle(tripTags)}
                </span>
              </div>
              <img
                className={`filters-filter-suffix${
                  tripsVisible ? ' open' : ''
                }`}
                src={arrow}
              />
            </button>
            {tripsVisible && (
              <div className="filters-trips">
                <Trips
                  tripsVisible={this.hanleToggleTripsVisible}
                  tripTags={tripTags}
                  applyTripTagFilter={(applay: boolean) =>
                    this.props.applyTripTagFilter(applay)
                  }
                  selectTripTag={(tripTag: ITripTags) =>
                    this.props.selectTripTag(tripTag)
                  }
                />
              </div>
            )}
            <button
              className="filters-filter"
              onClick={this.handleTogglePriceVisible}>
              <div className="filters-inner">
                <span className="filters-filter-prefix">
                  <svg>
                    <use xlinkHref={`${money}#money`} />
                  </svg>
                </span>
                <span className="filters-filter-value">{priceText}</span>
              </div>
              <span
                className={`filters-filter-suffix${
                  priceVisible ? ' open' : ''
                }`}>
                <img src={arrow} />
              </span>
            </button>
            {priceVisible && (
              <div style={{ marginBottom: '2rem' }}>
                <Slider
                  className="filters-slider"
                  range
                  tipFormatter={null}
                  min={0}
                  max={300}
                  value={[min, max]}
                  onChange={(v: [number, number]) => this.setPriceValue(v)}
                  onAfterChange={this.props.fetchTrips}
                />
                {this.state.priceTouched && (
                  <div
                    className="filters-clearbtn"
                    onClick={() => {
                      this.props.clearPrice()
                      this.setState({
                        priceTouched: false
                      })
                    }}>
                    CLEAR
                  </div>
                )}
              </div>
            )}
            <button
              className="filters-filter"
              style={{
                backgroundImage: `url(${mapBackground})`,
                justifyContent: 'center',
                backgroundSize: 'cover'
              }}
              onClick={this.props.openMapView}>
              <div className="filters-inner">
                <span className="filters-filter-prefix">
                  <img src={mapIcon} width="15px" alt="" srcSet="" />
                </span>
                <span className="filters-filter-value">
                  <div style={{ fontWeight: 500 }}>
                    {this.props.isMapViewOn ? 'CLOSE MAP VIEW' : 'MAP VIEW'}
                  </div>
                </span>
              </div>
            </button>
          </div>
          {!filterVisible ? (
            <div className="filters-m">
              <div style={{ display: 'flex' }}>
                <button
                  className="filters-filter"
                  style={{ width: '180px', marginRight: '10px' }}
                  onClick={this.props.hanleToggleFilterVisible}>
                  <div className="filters-inner">
                    <span className="filters-filter-value">Filters</span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      calendarVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                <button
                  className="filters-filter"
                  style={{
                    backgroundImage: `url(${mapBackground})`,
                    justifyContent: 'center',
                    backgroundSize: 'cover'
                  }}
                  onClick={this.props.openMapView}>
                  <div className="filters-inner">
                    <span className="filters-filter-prefix">
                      <img src={mapIcon} width="15px" alt="" srcSet="" />
                    </span>
                    <span className="filters-filter-value">
                      <div style={{ fontWeight: 500 }}>
                        {this.props.isMapViewOn ? 'CLOSE MAP VIEW' : 'MAP VIEW'}
                      </div>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="filters-m--open">
              <div className="filters-header">
                <button
                  onClick={this.props.hanleToggleFilterVisible}
                  className="filters-button">
                  <img src={filterClose} width="15px" alt="" srcSet="" />
                </button>
                <h5 className="filters-title">
                  Filters ({+priceTouched + +!!start + +tripsVisible})
                </h5>

                <button
                  onClick={this.handleClearFilters}
                  className="filters-button">
                  Clear
                </button>
              </div>
              <div style={{ padding: '30px 20px' }}>
                <button
                  className="filters-filter"
                  onClick={this.hanleToggleClendarVisible}>
                  <div className="filters-inner">
                    <svg className="filters-filter-prefix">
                      <use xlinkHref={`${calendar}#svg`} />
                    </svg>
                    <span className="filters-filter-value">
                      {startText} - {endText}
                    </span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      calendarVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                {calendarVisible && (
                  <div className="filters-calendar">
                    <Calendar
                      startDates={dates}
                      endDates={dates}
                      onChange={this.setDepartureValue}
                      selectRange
                      value={[start as Date, end as Date]}
                    />
                    {this.state.calendarTouched && (
                      <div
                        className="filters-clearbtn"
                        onClick={() => {
                          this.props.clearDates()
                          this.setState({
                            calendarTouched: false
                          })
                        }}>
                        CLEAR
                      </div>
                    )}
                  </div>
                )}
                <button
                  className="filters-filter"
                  onClick={this.hanleToggleTripsVisible}>
                  <div className="filters-inner">
                    <svg className="filters-filter-prefix">
                      <use xlinkHref={`${trip}#svg`} />
                    </svg>
                    <span className="filters-filter-value">
                      {this.createTripTitle(tripTags)}
                    </span>
                  </div>
                  <img
                    className={`filters-filter-suffix${
                      tripsVisible ? ' open' : ''
                    }`}
                    src={arrow}
                  />
                </button>
                {tripsVisible && (
                  <div className="filters-trips">
                    <Trips
                      tripsVisible={this.hanleToggleTripsVisible}
                      tripTags={tripTags}
                      applyTripTagFilter={(applay: boolean) =>
                        this.props.applyTripTagFilter(applay)
                      }
                      selectTripTag={(tripTag: ITripTags) =>
                        this.props.selectTripTag(tripTag)
                      }
                    />
                  </div>
                )}
                <button
                  className="filters-filter"
                  onClick={this.handleTogglePriceVisible}>
                  <div className="filters-inner">
                    <span className="filters-filter-prefix">
                      <svg>
                        <use xlinkHref={`${money}#money`} />
                      </svg>
                    </span>
                    <span className="filters-filter-value">{priceText}</span>
                  </div>
                  <span
                    className={`filters-filter-suffix${
                      priceVisible ? ' open' : ''
                    }`}>
                    <img src={arrow} />
                  </span>
                </button>
                {priceVisible && (
                  <div style={{ marginBottom: '2rem' }}>
                    <Slider
                      className="filters-slider"
                      range
                      tipFormatter={null}
                      min={0}
                      max={300}
                      value={[min, max]}
                      onChange={(v: [number, number]) => this.setPriceValue(v)}
                      onAfterChange={this.props.fetchTrips}
                    />
                    {this.state.priceTouched && (
                      <div
                        className="filters-clearbtn"
                        onClick={() => {
                          this.props.clearPrice()
                          this.setState({
                            priceTouched: false
                          })
                        }}>
                        CLEAR
                      </div>
                    )}
                  </div>
                )}
                <button
                  className="filters-filter"
                  style={{
                    backgroundColor: '#5dc3fd',
                    color: 'white',
                    justifyContent: 'center',
                    marginBottom: '50px'
                  }}
                  onClick={this.props.hanleToggleFilterVisible}>
                  <div className="filters-inner">
                    <div className="filters-filter-value">APPLY FILTERS</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }
  }
}
