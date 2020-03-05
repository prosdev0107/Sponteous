import { IFilters, IFiltersChange } from '../../Containers/Select/types'
import { ITripTags } from '../Trips/types'

export interface IProps {
  filters: IFilters
  isMapViewOn: boolean
  fetchTrips: () => void
  clearDates: () => void
  clearPrice: () => void
  openMapView: () => void
  clearTrips: () => void
  applyTripTagFilter: (applay: boolean) => void
  selectTripTag: (selectTripTag: ITripTags) => void
  hanleToggleFilterVisible: () => void
  onChange: (filters: IFiltersChange, callback?: () => void) => void
  filterVisible: boolean
  tripTags: ITripTags[]
  tripsActive: boolean
}
export interface IState {
  calendarVisible: boolean
  calendarTouched: boolean
  priceVisible: boolean
  priceTouched: boolean
  tripsVisible: boolean
}
