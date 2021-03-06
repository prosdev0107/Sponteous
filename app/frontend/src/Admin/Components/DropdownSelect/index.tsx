import React from 'react'
import classnames from 'classnames'
import arrowDown from '../../../Common/Utils/Media/arrowDown.svg'
import { IProps, IState, IOption } from './types'
import './styles.scss'
import { DEFAULT_SEARCH_RESULT } from 'src/Admin/Utils/constants';

class DropDownSelect extends React.Component<IProps, IState> {

  readonly state: IState = {
    isListVisible: false,
    inputValue: "",
    results: []
  }

  componentDidUpdate() {
    if (this.state.isListVisible) {
      document.addEventListener('click', this.toggleListVisibility)
    } else if (!this.state.isListVisible) {
      document.removeEventListener('click', this.toggleListVisibility)
    }
  }

  toggleListVisibility = (): void => {
    this.setState(prevState => ({ isListVisible: !prevState.isListVisible }))
  }

  handleSelectOption = (el: IOption): void => {
    const { onChange, saveAsObject } = this.props
    this.setState({ isListVisible: false, inputValue: el.name })
    onChange({
      target: {
        id: this.props.id,
        value: saveAsObject ? { _id: el._id, name: el.name } : (el.name === DEFAULT_SEARCH_RESULT.name || !this.verifyCountry(el.name)) ? "" : el.name
      }
    })
  }

  verifyCountry = (country: string): boolean => {
    const { options } = this.props

    for (const value of options) {
      if (value.name.toLowerCase() === country.toLowerCase()) {
        return true
      }
    }
    return false
  }

  handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { options } = this.props
    const tableau: IOption[] = options.filter((value: IOption) => {
      const name = value.name.toLowerCase()
      if (name.includes(e.target.value.toLowerCase())) {
        return value
      }
      return
    })

    if (!tableau.length) {
      tableau.push(DEFAULT_SEARCH_RESULT)
    }
    this.setState({ results: tableau })

    const country: IOption = {
      _id: '54',
      name: e.target.value
    }
    this.handleSelectOption(country)
  }

  renderOptions = (optionsArr: IOption[]): JSX.Element[] => {
    return (
      optionsArr.map(
        (el: IOption): JSX.Element => {
          return (
            <div
              key={el._id}
              onClick={() => this.handleSelectOption(el)}
              className="spon-dropdown__list-item">
              <p>{el.name}</p>
            </div>
          )
        }
      )
    )
  }

  render() {
    const { results, isListVisible, inputValue } = this.state
    const { options, label, placeholder, className } = this.props

    const dropdownClass = classnames('spon-dropdown', {
      [`${className}`]: className
    })
    const dropdownElementClass = classnames('spon-dropdown__element', {
      'spon-dropdown__element--active': isListVisible
    })
    const dropdownIcon = classnames('spon-dropdown__placeholder-icon', {
      'spon-dropdown__placeholder-icon--active': isListVisible
    })
    const dropdownList = classnames('spon-dropdown__list', {
      'spon-dropdown__list--active': isListVisible
    })

    return (
      <div className={dropdownClass}>
        <p className="spon-dropdown__label">{label}</p>
        <div
          className={dropdownElementClass}
          onClick={this.toggleListVisibility}
          onChange={() => this.setState({ isListVisible: true })}>
          <div className="spon-dropdown__placeholder">
            <input type="text"
              className="spon-dropdown__input"
              placeholder={placeholder}
              value={this.props.selectedValue || inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                this.setState({ inputValue: e.target.value })
                this.handleSearch(e)
              }}
            />
            <div>
              <img className={dropdownIcon} src={arrowDown} />
            </div>
          </div>

          <div className={dropdownList}>{!this.state.results.length ?
            this.renderOptions(options) : this.renderOptions(results)}</div>
        </div>
      </div>
    )
  }
}

export default DropDownSelect