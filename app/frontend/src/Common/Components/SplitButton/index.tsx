import React, { RefObject } from 'react'
import classnames from 'classnames'
import { IProps, IState } from './types'
import './styles.scss'

// const ICONS = {
//   plus: require('../../Utils/Media/plus.svg'),
//   cross: require('../../Utils/Media/cross.svg'),
//   crossWhite: require('../../Utils/Media/crossWhite.svg'),
//   arrowRight: require('../../Utils/Media/arrowRight.svg'),
//   arrowLeft: require('../../Utils/Media/arrowLeft.svg'),
//   undo: require('../../Utils/Media/undo.svg'),
//   trash: require('../../Utils/Media/trash.svg'),
//   pencil: require('../../Utils/Media/pencil.svg'),
//   arrowLeftUpdated: require('../../Utils/Media/arrowLeftUpdated.svg'),
//   arrowDown: require('../../Utils/Media/arrowDown.svg')
// }

export default class SplitButton extends React.Component<IProps, IState> {
  readonly state: IState = {
    buttons: false
  }

  dropdownWrapper: RefObject<HTMLDivElement> = React.createRef()

  componentDidMount() {
    document.addEventListener('mousedown', this.handleOutsideClick)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleOutsideClick);
  }

  handleOutsideClick : { (event: MouseEvent): void } = (event: MouseEvent) => {
    if (this.dropdownWrapper && !(this.dropdownWrapper.current! as any).contains(event.target)) {
      this.setState({ buttons: false })
    }
  }

  toggleButtons = () => {
    this.setState({ buttons: !this.state.buttons })
  }

  render() {
    const { onClick, text, className, type, isLoading, secondaryClick, secondaryText } = this.props
    const { buttons } = this.state

    const buttonClass = classnames('split-btn', {
      [`${className}`]: className,
      [`blue`]: 'blue',
      loading: isLoading
    })
    return (
      <div className={buttonClass} ref={this.dropdownWrapper}>
        <div className="main-btn-text">
          <button type={type} onClick={onClick}>{text}</button>
        </div>
        <div className="right-down" onClick={this.toggleButtons}>
          ▾
        </div>
        {buttons && (
          <div className="popup-btn">
            <button type="button" onClick={(e) => {
              this.setState({ buttons: false })
              if(secondaryClick) {
                secondaryClick(e)
              }
            }}>
              {secondaryText}
            </button>
          </div>
        )}
      </div>
    )
  }
}
