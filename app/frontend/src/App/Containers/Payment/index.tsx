import React, { Component } from 'react'
import moment from 'moment'
import { padStart } from 'lodash'
import { connect } from 'react-redux'

import Billing from '../../Components/Billing/Billing'
import BillingStatus from '../../Components/BillingStatus'
import MainBlock from '../../Components/MainBlock'
import Steps from '../../Components/Steps'
import Title from '../../Components/Title'
import Loader from '../../../Common/Components/Loader'
import Footer from '../../Components/Footer'
import withToast from '../../../Common/HOC/withToast'
import { IStore } from '../../../Common/Redux/types'
import {
  selectFinalSelected,
  selectQuantity,
  deselectionPrice,
  setFinalDestination
} from '../../../Common/Redux/Services/trips'
import { buyTickets } from '../../Utils/api'
import { IBuyData } from '../../Utils/apiTypes'
import { ISuccessValues } from '../../Components/Billing/types'
import { compose } from '../../../Common/HOC/compose'
import { RouteComponentProps } from 'react-router-dom'
import { getFromLS, getOwnerToken } from '../../../Common/Utils/helpers'
import ee from '../../Utils/emitter'
import { IResponseError } from '../../../Common/Utils/globalTypes'
import { IFinalSelected } from '../../Utils/appTypes'
import { Steps as StepsEnum } from '../../Containers/Payment/type'
import { IState, IProps } from './type'
import './styles.scss'

class PaymentContainer extends Component<
  RouteComponentProps<{}> & IProps,
  IState
> {
  readonly state: IState = {
    step: 0,
    isLoading: false
  }

  componentDidMount() {
    const owner = getFromLS('owner')

    if (!owner || !owner.token) {
      this.props.history.push('/')
    }

    window.scrollTo(0, 0)
  }

  setStep = (step: StepsEnum) => {
    const windowWitdth = window.innerWidth
    if (windowWitdth < 882) {
      window.scrollTo(0, 0)
    }

    this.setState({ step })
  }

  handleSubmit = ({ cardToken, passenger, payment }: ISuccessValues) => {
    const owner = getOwnerToken()

    const birthDate = +moment(
      `${passenger.birthyear}-${padStart(
        `${passenger.birthmonth}`,
        2,
        '0'
      )}-${padStart(`${passenger.birthdate}`, 2, '0')}`
    ).format('x')

    let email: string = passenger.email!
    if (email !== undefined) email = email.trim()

    let firstName: string = passenger.firstName!
    if (firstName !== undefined) firstName = firstName.trim()

    let middleName: string = passenger.middleName!
    if (middleName !== undefined) middleName = middleName.trim()

    let lastName: string = passenger.lastName!
    if (lastName !== undefined) lastName = lastName.trim()

    let phone: string = passenger.phone!
    if (phone !== undefined) phone = phone.trim()
    
    let address: string = payment.address!
    if (address !== undefined) address = address.trim()

    let city: string = payment.city!
    if (city !== undefined) city = city.trim()
    
    let zipCode: string = payment.zipCode!
    if (zipCode !== undefined) zipCode = zipCode.trim()
    

    const dataToSubmit: IBuyData = {
      owner,
      creditCardToken: cardToken,
      buyerInfo: {
        email,
        firstName,
        middleName,
        lastName,
        birthDate,
        phone: `${passenger.countryCode!.id}${phone}`,
        address,
        city,
        zipCode
      }
    }
    this.setState({ isLoading: true })
    buyTickets(dataToSubmit)
      .then(({ data }: { data: IFinalSelected }) => {
        this.props.setFinalDestination(data)
        this.props.history.push('/destinations/summary')
      })
      .catch((err: IResponseError) => {
        this.setState({ isLoading: false })
        this.props.showError(err)
      })
  }

  onNext = () => {
    ee.emit('SUBMIT')
  }

  render() {
    const { isLoading, step } = this.state
    const { quantity, deselectionPrice } = this.props

    return (
      <>
        <section className="payment_cnt">
          <MainBlock className="payment_cnt_main_block">
            <Title
              text="Fill in your billing information"
              selected={['billing']}
              className="pay-title"
            />
            <Steps />
          </MainBlock>
          <div className="payment_cnt-wrapper">
            <div className="payment_cnt-billing">
              <Billing
                step={step}
                setStep={this.setStep}
                onSuccess={this.handleSubmit}
              />
            </div>
            <div className="payment_cnt-status">
              <BillingStatus
                step={step}
                setStep={this.setStep}
                onSubmit={this.onNext}
                quantity={quantity}
                deselectionPrice={deselectionPrice}
                tours={this.props.selected}
              />
            </div>
          </div>
          {isLoading ? <Loader /> : null}
          {window.innerWidth > 882 && <Footer />}
        </section>
      </>
    )
  }
}

const composeHOCs = compose(
  PaymentContainer,
  withToast
)

const mapStateToProps = (state: IStore) => ({
  quantity: selectQuantity(state),
  selected: selectFinalSelected(state),
  deselectionPrice: deselectionPrice(state)
})

export default connect(
  mapStateToProps,
  { setFinalDestination }
)(composeHOCs)
