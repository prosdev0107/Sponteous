import { IFilters, IFiltersChange } from '../../Containers/Select/types'
import { ITripTags } from '../Trips/types';

export interface IProps {
  filters: IFilters
  isMapViewOn: boolean
  fetchTrips: () => void
  clearDates: () => void
  clearPrice: () => void
  openMapView: () => void
  applyTripTagFilter: (applay: boolean) => void
  selectTripTag: (selectTripTag: ITripTags) => void
  hanleToggleFilterVisible: () => void
  onChange: (filters: IFiltersChange, callback?: () => void) => void
  filterVisible: boolean
  tripTags: ITripTags[]
}
export interface IState {
  calendarVisible: boolean
  priceVisible: boolean
  priceTouched: boolean
  tripsVisible: boolean
}
