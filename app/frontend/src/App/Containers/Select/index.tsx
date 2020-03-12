import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import moment from 'moment'
import { connect } from 'react-redux'

import MainBlock from '../../Components/MainBlock'
import Search from '../../Components/Search'
import Steps from '../../Components/Steps'
import Filters from '../../Components/Filters'
import Destination from '../../Components/Destination'
import SelectPanel from '../../Components/SelectPanel'

import {
  addSelected,
  removeSelected,
  selectIsMaxSelected,
  selectSelected,
  selectQuantity,
  setQuantity,
  updateSelected,
  clearSelected,
  selectDeparture,
  setDeparture
} from '../../../Common/Redux/Services/trips'
import withToast from '../../../Common/HOC/withToast'
import { saveToLS, getOwnerToken } from '../../../Common/Utils/helpers'
import * as API from '../../Utils/api'
import { IBookedData } from '../../Utils/apiTypes'
import { IStore } from '../../../Common/Redux/types'
import { STEP_IDS } from '../../Utils/constants'
import { RouteComponentProps } from 'react-router-dom'
import { ISelectedData, ITrip } from '../../Utils/appTypes'
import { IState, IProps, IFiltersChange, IBookedType } from './types'
import './styles.scss'
import Title from 'src/App/Components/Title'
import { ITicket } from 'src/Common/Utils/globalTypes'
import {
  Map,
  InfoWindow,
  Marker,
  GoogleApiWrapper,
  MapProps
} from 'google-maps-react'
import { compose } from 'redux'
import { DESTINATIONFILTERS } from 'src/Admin/Utils/constants'

import marker from '../../Utils/Media/marker.png'
import markerSelected from '../../Utils/Media/marker-selected.png'
import arrow from '../../../Common/Utils/Media/arrow.svg'
import { ITripTags } from 'src/App/Components/Trips/types'
import capsule from '../../Utils/Media/capsule.png'

const MAX = 5

const mapStyle = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#e9e9e9'
      },
      {
        lightness: 17
      }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5'
      },
      {
        lightness: 20
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 17
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 29
      },
      {
        weight: 0.2
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 18
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      },
      {
        lightness: 16
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5'
      },
      {
        lightness: 21
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#dedede'
      },
      {
        lightness: 21
      }
    ]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        visibility: 'on'
      },
      {
        color: '#ffffff'
      },
      {
        lightness: 16
      }
    ]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        saturation: 36
      },
      {
        color: '#333333'
      },
      {
        lightness: 40
      }
    ]
  },
  {
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f2f2f2'
      },
      {
        lightness: 19
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#fefefe'
      },
      {
        lightness: 20
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#fefefe'
      },
      {
        lightness: 17
      },
      {
        weight: 1.2
      }
    ]
  }
]

class SelectContainer extends Component<
  RouteComponentProps<{}> & MapProps & IProps,
  IState
> {
  readonly state: IState = {
    trips: [],
    tripsLocal: [],
    filters: {
      start: undefined,
      end: undefined,
      min: 0,
      max: 2000
    },
    tripsActive: false,
    tripTags: [],
    page: 0,
    isLoading: true,
    isCalendarOpen: false,
    isMapViewOpen: false,
    showingInfoWindow: false,
    activeMarker: {},
    selectedPlace: {},
    isSorting: 0,
    filterVisible: false
  }

  private filters = React.createRef<Filters>()

  componentDidMount() {
    window.scrollTo(0, 0)
    const { quantity, departure } = this.props
    this.handleFetchTrips(
      this.state.page,
      10,
      0,
      0,
      0,
      0,
      quantity.Adult,
      quantity.Youth,
      departure
    ).then(() => {
      this.setState({ isLoading: false, isSorting: 0 })
      if (this.state.trips.length >= 10 && this.state.trips.length > 0) {
        this.attachScrollEvent()
      }
    })
  }

  componentWillUnmount() {
    this.detachScrollEvent()
  }

  handleFetchTrips = (
    page: number,
    limit: number,
    priceStart: number,
    priceEnd: number,
    dateStart: number,
    dateEnd: number,
    adult: number,
    youth: number,
    departure: string
  ) => {
    return API.getTrips(
      page,
      limit,
      priceStart,
      priceEnd,
      dateStart,
      dateEnd,
      adult,
      youth,
      departure
    )
      .then(({ data }) => {
        let tripTags: ITripTags[] = []
        data.forEach((trip: any) => {
          trip.destination.tags.forEach((tag: string) => {
            for (let i = 0; i < tripTags.length; i++) {
              if (tripTags[i].tag === tag) return
            }
            tripTags.push({ tag: tag, active: false })
          })
        })

        this.setState((state: IState) => ({
          tripTags: tripTags || [],
          isLoading: false,
          trips: [...data],
          tripsLocal: [...data]
        }))
        return data.length
      })
      .catch(err => console.log(err.response))
  }

  selectTripTag = (tripTag: ITripTags) => {
    let newtripTags: ITripTags[]
    newtripTags = this.state.tripTags.map((curTripTag: ITripTags) => {
      if (tripTag.tag === curTripTag.tag) curTripTag.active = !curTripTag.active
      return curTripTag
    })

    if (newtripTags.find((tag: any) => tag.active)) {
      this.setState({ tripTags: newtripTags, tripsActive: true })
    } else {
      this.setState({ tripTags: newtripTags, tripsActive: false })
    }
  }

  applyTripTagFilter = (applay: boolean) => {
    if (
      applay &&
      this.state.tripTags.find((tag: ITripTags) => tag.active === true)
    )
      this.filterTrip()
    else {
      this.clearTrips()
    }
  }

  filterTrip = () => {
    let { tripTags } = this.state
    let tagsTreepFilter: any = []
    if (this.state.tripTags.find((tag: ITripTags) => tag.active === true)) {
      this.state.tripsLocal.forEach((trip: any) => {
        trip.destination.tags.forEach((tag: string) => {
          for (let i = 0; i < tripTags.length; i++) {
            if (tripTags[i].tag === tag && tripTags[i].active === true) {
              if (
                tagsTreepFilter.find(
                  (searchTrip: any) => trip._id === searchTrip._id
                )
              )
                return
              tagsTreepFilter.push(trip)
              return
            }
          }
        })
      })
    } else {
      tagsTreepFilter = this.state.trips
    }
    this.setState({ trips: tagsTreepFilter })
  }

  getTicketsType = (tickets: ITicket[]) => {
    return tickets
      .reduce((types: string[], ticket: ITicket) => {
        if (!types.includes(ticket.type)) {
          return [...types, ticket.type]
        }
        return types
      }, [])
      .sort()
  }
  isInPriceRange = (
    trip: any,
    adult: any,
    youth: any,
    priceStart: any,
    priceEnd: any
  ) => {
    const totalPrice = 2 * (trip.adultPrice * adult + trip.childPrice * youth)
    return totalPrice <= priceEnd && totalPrice >= priceStart
  }
  isInDateRange = (tickets: any, dateStart: any, dateEnd: any) => {
    let filteredTicket
    filteredTicket = tickets.filter((ticket: any) =>
      this.checkDateRange(ticket, dateStart, dateEnd)
    )
    return filteredTicket
  }
  checkDateRange = (ticket: any, dateStart: any, dateEnd: any) => {
    let start = new Date(ticket.date.start).getTime()
    let end = new Date(ticket.date.end).getTime()
    return (
      +moment(dateStart).format('x') <= start &&
      +moment(dateEnd).format('x') >= end
    )
  }
  handleFetchInitialTripsWithFilter = () => {
    const {
      tripsLocal,
      filters: { min, max, start, end }
    } = this.state

    let pricefilter: any = []
    let dateFilter: any = []

    pricefilter = tripsLocal.filter((trip: any) =>
      this.isInPriceRange(trip, trip.Adult, trip.Youth, min, max)
    )
    this.setState({ trips: pricefilter })
    if (start && end) {
      pricefilter.filter((trip: any) => {
        let ticket = this.isInDateRange(trip.tickets, start, end)
        pricefilter.forEach((item: any) => {
          if (ticket.length !== 0)
            if (item._id === ticket[0].trip) dateFilter.push(item)
        })
      })
      this.setState({ trips: dateFilter })
    }
  }

  handleBookTrips = () => {
    const { selected, quantity, departure } = this.props
    const token = getOwnerToken()

    const bookedTrips = selected.map((selectedItem: ISelectedData) => {
      if (selectedItem.arrivalTicket && selectedItem.departureTicket) {
        return {
          arrivalTicket: selectedItem.arrivalTicket,
          departureTicket: selectedItem.departureTicket
        }
      } else {
        return {
          id: selectedItem.tripId,
          departure: selectedItem.departure.name,
          destination: selectedItem.destination.name,
          dateStart: selectedItem.dateStart,
          dateEnd: selectedItem.dateEnd
        }
      }
    })

    const data: IBookedData = {
      departure,
      Adult: quantity.Adult,
      Youth: quantity.Youth,
      trips: bookedTrips
    }

    if (token) {
      data.ownerHash = token
    }

    API.bookTrips(data)
      .then(res => {
        const bookedTrips = res.data.trips
        const selectedTrips = this.props.selected.map((item: ISelectedData) => {
          const filteredTrip: IBookedType = bookedTrips.find(
            (trip: IBookedType) => item.tripId === trip.trip
          )
          if (filteredTrip) {
            //item.adultPrice = filteredTrip.cost
          }
          return item
        })

        saveToLS('owner', {
          billing: res.data.billing,
          createdAt: res.data.createdAt,
          token: res.data.owner,
          data: {
            departure,
            quantity,
            selected: res.data.trips
          }
        })

        selectedTrips.forEach(trip => {
          trip['Adult'] = data.Adult
          trip['Youth'] = data.Youth
        })

        this.props.updateSelected(selectedTrips)
        this.props.history.push('/destinations/deselect')
      })
      .catch(err => this.props.showError(err))
  }

  onSelect = (data: ISelectedData) => {
    if (!this.props.isMax) {
      this.props.addSelected(data)
    }
  }

  onDeselect = (tripId: string) => {
    this.props.removeSelected(tripId)
  }

  isSelectedPlace = (id: any) => {
    let result = false
    this.props.selected.map(place => {
      if (place._id === id) {
        result = true
      }
    })
    return result
  }

  attachScrollEvent = () => {
    window.addEventListener('scroll', this.handleScroll, false)
  }

  detachScrollEvent = () => {
    window.removeEventListener('scroll', this.handleScroll, false)
  }

  handleScroll = (e: MouseEvent) => {
    const {
      filters: { min, max, start, end }
    } = this.state
    const { quantity, departure } = this.props
    const treshold = 500
    const totalHeight = document.documentElement.scrollHeight
    const windowHeight = window.innerHeight
    const scrollTop = window.pageYOffset

    const offset = totalHeight - (scrollTop + windowHeight)
    if (offset < treshold) {
      this.detachScrollEvent()
      this.setState(
        (state: IState) => ({ page: state.page + 1 }),
        () => {
          this.handleFetchTrips(
            this.state.page,
            10,
            min,
            max,
            start !== undefined ? +moment(start).format('x') : 0,
            end !== undefined ? +moment(end).format('x') : 0,
            quantity.Adult,
            quantity.Youth,
            departure
          ).then((dataLength: number) => {
            if (dataLength > 0) {
              this.attachScrollEvent()
            }
          })
        }
      )
    }
  }

  handleFilterChange = (filters: IFiltersChange, callback?: () => void) => {
    console.log(filters)
    this.setState(
      (state: IState) => ({
        filters: {
          ...state.filters,
          ...filters
        }
      }),
      () => callback && callback()
    )
  }

  clearTrips = () => {
    this.setState({
      tripTags: this.state.tripTags.map((tag: ITripTags) => ({
        ...tag,
        active: false
      })),
      trips: this.state.tripsLocal,
      tripsActive: false
    })
  }

  handleClearFilterDates = () => {
    const {
      filters: { start, end }
    } = this.state

    if (start && end) {
      this.setState(
        (state: IState) => ({
          filters: {
            ...state.filters,
            start: undefined,
            end: undefined
          }
        }),
        () => this.handleFetchInitialTripsWithFilter()
      )
    }
  }

  handleClearFilterPrice = () => {
    const {
      filters: { min, max }
    } = this.state

    if (min !== 0 || max !== 2000) {
      this.setState(
        (state: IState) => ({
          filters: {
            ...state.filters,
            min: 0,
            max: 2000
          }
        }),
        () => this.handleFetchInitialTripsWithFilter()
      )
    }
  }

  calendarOpened = () => {
    this.setState({ isCalendarOpen: true })
  }

  calendarClosed = () => this.setState({ isCalendarOpen: false })

  openMapView = () => {
    this.setState((state: IState) => ({
      isMapViewOpen: !state.isMapViewOpen,
      isCalendarOpen: false
    }))
  }

  onMarkerClick = (props: any, marker: any) => {
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    })
  }

  onInfoWindowOpen = () => {
    const { isMax, quantity } = this.props
    const { _id, data } = this.state.selectedPlace
    const filtered = this.props.selected.filter((item: ISelectedData) => {
      if (item.tripId === _id) {
        return true
      }
      return false
    })
    const isSelected = filtered.length > 0
    const destination = (
      <Destination
        key={_id}
        index={_id}
        data={data}
        quantity={quantity}
        selected={isSelected}
        onSelect={this.onSelect}
        onDeselect={this.onDeselect}
        isMax={isMax}
        onCalendarOpen={this.calendarOpened}
        onCalendarClose={this.calendarClosed}
        isCalendarOpen={this.state.isCalendarOpen}
      />
    )

    ReactDOM.render(
      React.Children.only(destination),
      document.getElementById('iwc')
    )
  }

  handleChange = (e: any) => {
    const value: number = parseInt(DESTINATIONFILTERS[e.target.value]._id)
    this.setState({ isSorting: value })
  }

  editTrips = () => {
    this.props.history.push('/destinations/editSelection')
  }

  _mapLoaded(mapProps: any, map: any) {
    map.setOptions({
      styles: mapStyle
    })
  }
  mapClicked = () => {
    this.setState({
      showingInfoWindow: false,
      isCalendarOpen: false
    })
  }

  hanleToggleFilterVisible = () => {
    this.setState((state: IState) => ({
      filterVisible: !state.filterVisible
    }))
  }

  render() {
    const {
      isCalendarOpen,
      filters,
      trips,
      filterVisible,
      tripTags
    } = this.state
    const { isMax, quantity, selected, departure } = this.props
    const isMapViewOpen = this.state.isMapViewOpen
    let locations: any = []
    if (this.state.trips && this.state.trips.length > 0) {
      locations = this.state.trips.map(function(x: any) {
        return {
          _id: x._id,
          data: x,
          location: {
            lat: x.destination.latitude,
            lng: x.destination.longitude
          }
        }
      })
    }
    const center = locations[0]
    let lat = 42.39,
      lng = -72.52
    if (center) {
      lat = parseFloat(center.location.lat)
      lng = parseFloat(center.location.lng)
    }
    return (
      <div>
        {!isMapViewOpen ? (
          <section className={`select-cnt ${isCalendarOpen ? 'calendar' : ''}`}>
            <MainBlock className="select-cnt-block">
              <Search
                departure={departure}
                setDeparture={this.props.setDeparture}
                setQuantity={this.props.setQuantity}
                quantity={quantity}
                onSubmit={() => {
                  this.setState({ isLoading: true })
                  this.setState({ tripsLocal: [] })
                  this.setState({ trips: [] })
                  this.filters.current!.handleClearFilters()
                  this.handleFetchTrips(
                    this.state.page,
                    10,
                    0,
                    0,
                    0,
                    0,
                    quantity.Adult,
                    quantity.Youth,
                    departure
                  ).then(() => {
                    this.setState({ isLoading: false, isSorting: 0 })
                    if (
                      this.state.trips.length >= 10 &&
                      this.state.trips.length > 0
                    ) {
                      this.attachScrollEvent()
                    }
                  })
                }}
                initialValue={departure}
              />
              <Steps />
            </MainBlock>
            <section className="select-cnt-inner">
              <section className="select-cnt-inner-filters">
                <Filters
                  ref={this.filters}
                  tripsActive={this.state.tripsActive}
                  clearTrips={() => this.clearTrips()}
                  applyTripTagFilter={(applay: boolean) =>
                    this.applyTripTagFilter(applay)
                  }
                  selectTripTag={(tripTag: ITripTags) =>
                    this.selectTripTag(tripTag)
                  }
                  onChange={this.handleFilterChange}
                  fetchTrips={this.handleFetchInitialTripsWithFilter}
                  clearDates={this.handleClearFilterDates}
                  clearPrice={this.handleClearFilterPrice}
                  filters={filters}
                  isMapViewOn={this.state.isMapViewOpen}
                  openMapView={this.openMapView}
                  tripTags={tripTags}
                  filterVisible={filterVisible}
                  hanleToggleFilterVisible={this.hanleToggleFilterVisible}
                />
                <div className="capsule">
                  <div className="capsule-header">How it works</div>
                  <div className="capsule-text">
                    We reward flexible customers by offering them low prices.
                    Preselect your favorite destinations and find out your final
                    one right after the payment.
                  </div>
                  <img src={capsule} alt="" srcSet="" />
                </div>
              </section>
              {!filterVisible && (
                <section className="select-cnt-inner-destinations">
                  <div className="select-cnt-inner-destinations-header">
                    <div className="select-cnt-inner-destinations-header-text">
                      <Title
                        className="select-cnt-inner-title"
                        text={`Select 5 destinations from the ${
                          this.state.trips.length
                        } destinations below`}
                        selected={[
                          `${this.state.trips.length} destinations`,
                          '5 destinations'
                        ]}
                      />
                    </div>
                    <div className="sortbyCtrl">
                      <span className="filters-filter-value">Sort By: </span>
                      <select
                        name="drpFilterDestination"
                        id="drpFilterDestination"
                        placeholder="Recommended"
                        className="spon-trip-modal__dropdown"
                        style={{
                          WebkitAppearance: 'none',
                          background: `url(${arrow}) no-repeat right`
                        }}
                        onChange={(e: any) => this.handleChange(e)}
                        defaultValue={this.state.isSorting.toString()}>
                        {DESTINATIONFILTERS.map(x => (
                          <option key={x._id} value={x._id}>
                            {' '}
                            {x.name}
                          </option>
                        ))}
                        ;
                      </select>
                    </div>
                  </div>
                  <div className="select-cnt-inner-destination-list">
                    {this.state.isLoading ? <div>Loading..</div> : null}
                    {!this.state.isLoading && trips.length === 0 ? (
                      <div>No ticket found</div>
                    ) : null}
                    {!this.state.isLoading &&
                      trips != undefined &&
                      trips.length > 0 &&
                      trips
                        .slice()
                        .sort((a: any, b: any) => {
                          if (this.state.isSorting == 1) {
                            return a.destination.name.localeCompare(
                              b.destination.name
                            )
                          }

                          if (this.state.isSorting == 2) {
                            let finalCostA = 0,
                              finalCostB = 0

                            if (a['destinationCharges']) {
                              finalCostA =
                                a['destinationCharges'].adultPrice *
                                  a['Adult'] +
                                a['destinationCharges'].childPrice *
                                  a['Youth'] +
                                (a.adultPrice * a['Adult'] +
                                  a.childPrice * a['Youth'])
                            } else {
                              finalCostA =
                                2 *
                                (a.adultPrice * a['Adult'] +
                                  a.childPrice * a['Youth'])
                            }

                            a['finalCost'] = finalCostA

                            if (b['destinationCharges']) {
                              finalCostB =
                                b['destinationCharges'].adultPrice *
                                  b['Adult'] +
                                b['destinationCharges'].childPrice *
                                  b['Youth'] +
                                (b.adultPrice * b['Adult'] +
                                  b.childPrice * b['Youth'])
                            } else {
                              finalCostB =
                                2 *
                                (b.adultPrice * b['Adult'] +
                                  b.childPrice * b['Youth'])
                            }

                            b['finalCost'] = finalCostB

                            return (
                              parseFloat(a.finalCost) - parseFloat(b.finalCost)
                            )
                          }

                          return a
                        })
                        .map((trip: ITrip, index) => {
                          trip.type = 'trip'
                          const filtered = this.props.selected.filter(
                            (item: ISelectedData) => {
                              if (item.tripId === trip._id) {
                                ;(trip.dateStart = item.dateStart),
                                  (trip.dateEnd = item.dateEnd)

                                return true
                              }

                              return false
                            }
                          )
                          const isSelected = filtered.length > 0

                          return (
                            <Destination
                              key={index}
                              index={trip._id}
                              data={trip}
                              quantity={quantity}
                              selected={isSelected}
                              onSelect={this.onSelect}
                              onDeselect={this.onDeselect}
                              isMax={isMax}
                              onCalendarOpen={this.calendarOpened}
                              onCalendarClose={this.calendarClosed}
                              isCalendarOpen={false}
                            />
                          )
                        })}
                  </div>
                </section>
              )}
            </section>
            <SelectPanel
              step={STEP_IDS.SELECT}
              selected={selected}
              isMax={isMax}
              max={MAX}
              onEdit={this.editTrips}
              onNext={this.handleBookTrips}
            />
          </section>
        ) : (
          <section className="map-cnt">
            <Filters
              tripTags={tripTags}
              ref={this.filters}
              tripsActive={this.state.tripsActive}
              clearTrips={() => this.clearTrips()}
              applyTripTagFilter={(applay: boolean) =>
                this.applyTripTagFilter(applay)
              }
              selectTripTag={(tripTag: ITripTags) =>
                this.selectTripTag(tripTag)
              }
              onChange={this.handleFilterChange}
              fetchTrips={this.handleFetchInitialTripsWithFilter}
              clearDates={this.handleClearFilterDates}
              clearPrice={this.handleClearFilterPrice}
              filters={filters}
              isMapViewOn={this.state.isMapViewOpen}
              openMapView={this.openMapView}
              filterVisible={filterVisible}
              hanleToggleFilterVisible={this.hanleToggleFilterVisible}
            />
            <Map
              google={this.props.google}
              zoom={5}
              initialCenter={{
                lat: lat,
                lng: lng
              }}
              // zoomControl={false}
              mapTypeControl={false}
              fullscreenControl={false}
              scaleControl={false}
              gestureHandling={'greedy'}
              onReady={(mapProps, map) => this._mapLoaded(mapProps, map)}
              onClick={this.mapClicked}>
              {locations.map((location: any, index: number) => {
                return (
                  <Marker
                    key={index}
                    name={'Current location'}
                    position={{
                      lat: location.location.lat,
                      lng: location.location.lng
                    }}
                    icon={{
                      url: this.isSelectedPlace(location._id)
                        ? markerSelected
                        : marker
                    }}
                    _id={location._id}
                    data={location.data}
                    onClick={this.onMarkerClick}
                  />
                )
              })}

              <InfoWindow
                marker={this.state.activeMarker}
                visible={this.state.showingInfoWindow}
                onOpen={() => {
                  this.onInfoWindowOpen()
                }}>
                <div id="iwc" />
              </InfoWindow>
            </Map>
            <SelectPanel
              step={STEP_IDS.SELECT}
              selected={selected}
              isMax={isMax}
              max={MAX}
              onEdit={this.editTrips}
              onNext={this.handleBookTrips}
            />
          </section>
        )}
      </div>
    )
  }
}

const mapStateToProps = (state: IStore) => ({
  isMax: selectIsMaxSelected(state),
  quantity: selectQuantity(state),
  selected: selectSelected(state),
  departure: selectDeparture(state)
})

export default compose(
  connect(
    mapStateToProps,
    {
      addSelected,
      removeSelected,
      updateSelected,
      clearSelected,
      setQuantity,
      setDeparture
    }
  ),
  GoogleApiWrapper({
    apiKey: 'AIzaSyCOvJSJiJaKykPQ0dfzYWO1OVRBNlnN8FU'
  })
)(withToast(SelectContainer))
