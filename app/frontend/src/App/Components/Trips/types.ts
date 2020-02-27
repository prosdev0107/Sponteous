export interface State {
}
export interface IProps {
  applyTripTagFilter: (applay: boolean) => void
  selectTripTag: (selectTripTag: ITripTags) => void
  tripTags: ITripTags[]
}

export interface ITripTags {
  tag: string,
  active: boolean
}