import { MODAL_TYPE } from '../../Utils/adminTypes'

export interface IProps {
  title: string
  heading?: string
  modal?: MODAL_TYPE
  query?: string
  enable?: boolean
  handleSearch?: (e:React.ChangeEvent<HTMLInputElement>) => void
  handleOpenModal?: (type: MODAL_TYPE, heading: string) => void,
  handleToggle?: () => void
}
