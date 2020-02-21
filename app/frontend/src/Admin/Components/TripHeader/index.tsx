import React from 'react'
import Button from '../../../Common/Components/Button'
import { default as Select } from 'react-dropdown-select'
import { MODAL_TYPE } from '../../Utils/adminTypes'
import { IProps, IState, ITerritory, IOptions, IOption } from './types'
import './styles.scss'
import styled from 'styled-components'

class TripHeader extends React.Component<IProps, IState> {
  state: IState = {
    filtersFrom: [],
    filtersTo: [],
    option: {
      item: {},
      itemIndex: {},
      props: {},
      state: {},
      methods: {}
    }
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props !== prevProps) {
      const { availableDepartures, availableDestinations } = this.props
      let filtersFrom: ITerritory[] = []
      for (let index: number = 0; index < availableDepartures.length; index++) {
        const option: any = {
          value: index,
          label: availableDepartures[index].label,
          country: availableDepartures[index].country
        }
        filtersFrom.push(option)
      }

      let filtersTo: ITerritory[] = []
      for (
        let index: number = 0;
        index < availableDestinations.length;
        index++
      ) {
        const option: any = {
          value: index,
          label: availableDestinations[index].label,
          country: availableDestinations[index].country
        }
        filtersTo.push(option)
      }
      this.setState({ filtersFrom, filtersTo })
    }
  }

  handleFiltersChange = (
    territories: ITerritory[],
    filter: ITerritory[],
    changeFilter: (filters: string[]) => void
  ) => {
    const filters: string[] = []

    territories.map(territory => {
      if (territory.country === 'country') {
        filter.map(dataTerritory => {
          if (
            dataTerritory.country !== 'country' &&
            dataTerritory.country === territory.label
          ) {
            filters.push(dataTerritory.label)
          }
        })
      } else {
        filters.push(territory.label)
      }
    })

    const uniqueFilters = filters.reduce((unique: any, other: any) => {
      if (!unique.some((label: string) => label === other)) {
        unique.push(other)
      }
      return unique
    }, [])

    changeFilter(uniqueFilters)
  }

  handleFiltersFromChange = (territories: ITerritory[]) => {
    this.handleFiltersChange(
      territories,
      this.state.filtersFrom,
      this.props.changeFilterFrom
    )
  }

  handleFiltersToChange = (territories: ITerritory[]) => {
    this.handleFiltersChange(
      territories,
      this.state.filtersTo,
      this.props.changeFilterTo
    )
  }

  isCountry = (option: any) => {
    return option.item.country && option.item.country === 'country'
  }

  customItemRenderer = (option: IOptions) => (
    <StyledItem color={this.isCountry(option) ? '#4142a6' : '#5dc3fd'}>
      <div
        onClick={() => {
          const temp: any = option.state.values.filter(
            (value: ITerritory) => value.label === option.item.label
          )
          if (temp.length > 0) {
            option.methods.removeItem(option.item.value, option.item)
          } else {
            option.methods.addItem(option.item)
          }
        }}>
        <input
          type="checkbox"
          checked={option.methods.isSelected(option.item)}
        />
        <span id="label">{option.item.label}</span>
      </div>
    </StyledItem>
  )

  customOptionRenderer = (option: IOption) => (
    <StyledOption
      color={
        option.item.country && option.item.country === 'country'
          ? '#4142a6'
          : '#5dc3fd'
      }>
      {option.item.label}
      <span onClick={() => option.methods.removeItem(null, option.item)}>
        &times;
      </span>
    </StyledOption>
  )

  customContentRenderer = (option: IOptions) =>
    option.state.loading ? (
      <div>Loading...</div>
    ) : (
      <StyledContent>
        {option.state.values.length ? (
          option.state.values.map((item: any) => {
            const options: IOption = {
              item: item,
              props: option.props,
              state: option.state,
              methods: option.methods
            }
            return option.props.optionRenderer(options)
          })
        ) : (
          <div className="placeholder">{option.props.placeholder}</div>
        )}
      </StyledContent>
    )

  render() {
    const { title, heading, modal, handleOpenModal } = this.props

    const { filtersFrom, filtersTo } = this.state

    return (
      <div className="spon-admin-trip-header">
        <div className="spon-admin-trip-header__inner">
          <h1 className="spon-admin-trip-header__heading">{title}</h1>
        </div>

        <div className="spon-admin-trip-header__select">
          <div className="spon-admin-trip-header__select__From">
            <Select
              className="spon-admin-trip-header__select__From"
              multi
              itemRenderer={this.customItemRenderer}
              optionRenderer={this.customOptionRenderer}
              placeholder={'From'}
              options={filtersFrom}
              onChange={this.handleFiltersFromChange}
              clearable
              searchable
            />
          </div>
          <div className="spon-admin-trip-header__select__To">
            <Select
              className="spon-admin-trip-header__select__To"
              multi
              itemRenderer={this.customItemRenderer}
              optionRenderer={this.customOptionRenderer}
              placeholder={'To'}
              options={filtersTo}
              onChange={this.handleFiltersToChange}
              clearable
              searchable
            />
          </div>
        </div>
        <div className="spon-admin-trip-header__button_div">
          {handleOpenModal ? (
            <div className="dropdown">
              <button className="dropbtn">
                Bulk ▾<i className="fa fa-caret-down" />
              </button>
              <div className="dropdown-content">
                <a
                  onClick={() =>
                    handleOpenModal(MODAL_TYPE.BULK_CHANGE, 'Bulk changes')
                  }>
                  Modifications
                </a>
                <a
                  onClick={() =>
                    handleOpenModal(
                      MODAL_TYPE.BULK_TIME_SELECTION,
                      'Bulk time selection'
                    )
                  }>
                  Time selection
                </a>
                <a
                  onClick={() =>
                    handleOpenModal(
                      MODAL_TYPE.BULK_SCHEDULE,
                      'Bulk range creation'
                    )
                  }>
                  Range creation
                </a>
              </div>
            </div>
          ) : null}
        </div>
        {handleOpenModal && heading && modal ? (
          <Button
            className="spon-admin-trip-header__add-button"
            variant="blue"
            icon="plus"
            text="ADD NEW"
            onClick={() => handleOpenModal(modal, heading)}
          />
        ) : handleOpenModal ? (
          <Button
            className="spon-admin-trip-header__add-button"
            variant="blue"
            icon="plus"
            text="ADD NEW"
            onClick={() => handleOpenModal(MODAL_TYPE.ADD_TRIP, 'Create trip')}
          />
        ) : null}
      </div>
    )
  }
}

const StyledContent = styled.div`
  padding: 2px;
  color: #555;
  border-radius: 3px;
  margin: 3px;
  cursor: pointer;
  height: 2.9rem;
  width: 100%;
  overflow-y: scroll;
  .placeholder {
    position: relative;
    top: 20%;
  }
`

const StyledItem = styled.div`
  color: #555;
  border-radius: 3px;
  margin: 3px;
  cursor: pointer;
  span#label {
    padding: 5px;
    color: white;
    background: ${(props: any) => props.color};
    border-radius: 5px;
    box-shadow5px10pxs: ;
  }
`

const StyledOption = styled.span`
  padding: 3px 10px;
  color: white;
  border-radius: 3px;
  margin: 3px;
  cursor: pointer;
  display: inline-flex;
  flex-direction: row;
  background-color: ${(props: any) => props.color};
  border: 1px solid;
  transition: all 1s ease-in;

  span {
    display: none;
    transition: all 1s ease-in;
  }

  :hover {
    span {
      display: inline;
      margin: 0 0 0 5px;
      color: white;
    }
  }
`
export default TripHeader
