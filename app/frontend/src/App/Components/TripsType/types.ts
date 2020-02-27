import { ITripTags } from "../Trips/types";

export interface State {
}
export interface IProps {
    tripTag: ITripTags
    selectTripTag: (selectTripTag: ITripTags) => void
}