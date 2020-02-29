import { ITrip, ISelectedData, IPassenger } from '../../../App/Utils/appTypes'
import { IResponseError } from '../../../Common/Utils/globalTypes'
import { ITripTags } from 'src/App/Components/Trips/types'

export interface IFiltersChange {
  min?: number
  max?: number
  start?: Date
  end?: Date
}

export interface IFilters {
  min: number
  max: number
  start: Date | undefined
  end: Date | undefined
}

export interface IState {
  tripsActive: boolean
  tripTags: ITripTags[]
  trips: ITrip[]
  tripsLocal: ITrip[]
  filters: {
    start: Date | undefined
    end: Date | undefined
    min: number
    max: number
  }
  page: number
  isLoading: boolean
  isCalendarOpen: boolean
  isMapViewOpen: boolean
  showingInfoWindow: boolean
  activeMarker: any
  selectedPlace: any
  isSorting: number
  filterVisible: boolean
}

export interface IProps {
  isMax: boolean
  quantity: IPassenger

  departure: string
  selected: ISelectedData[]
  showError: (err: IResponseError, defaultText?: string) => void
  showSuccess: (msg: string) => void
  setQuantity: (quantity: IPassenger) => void
  setDeparture: (departure: string) => void
  addSelected: (selected: ISelectedData) => void
  removeSelected: (tripId: string) => void
  updateSelected: (selected: ISelectedData[]) => void
}

export interface IBookedType {
  arrivalTicket: string
  cost: number
  departureTicket: string
  trip: string
  withTime: boolean
  _id: string
}

export interface ITripInfo {
  _id: string
  arrivalTicketsQty: number
  departureTicketsQty: number
}
