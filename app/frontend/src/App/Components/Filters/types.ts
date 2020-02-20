import { IFilters, IFiltersChange } from '../../Containers/Select/types'

export interface IProps {
  filters: IFilters
  isMapViewOn: boolean
  fetchTrips: () => void
  clearDates: () => void
  clearPrice: () => void
  openMapView: () => void
  hanleToggleFilterVisible: () => void
  onChange: (filters: IFiltersChange, callback?: () => void) => void
  filterVisible: boolean
}
export interface IState {
  calendarVisible: boolean
  priceVisible: boolean
  priceTouched: boolean
}
