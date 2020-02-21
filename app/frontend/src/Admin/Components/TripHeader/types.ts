import { MODAL_TYPE } from '../../Utils/adminTypes'

export interface IProps {
  title: string
  availableDepartures: any[]
  availableDestinations: any[]
  heading?: string
  modal?: MODAL_TYPE
  query?: string
  handleOpenModal?: (type: MODAL_TYPE, heading: string) => void
  changeFilterFrom: (filterFrom: string[]) => void
  changeFilterTo: (filterTo: string[]) => void
}

export interface IState {
  filtersFrom: ITerritory[]
  filtersTo: ITerritory[]
  option: IOptions
}

export enum COLOR {
  VIOLET = '#5556dc'
}

export interface ITerritory {
  value: number
  label: string
  country: string
}

export interface IOptions {
  item: any
  itemIndex: any
  props: any
  state: any
  methods: any
}

export interface IOption {
  item: any
  props: any
  state: any
  methods: any
}
