import React from 'react'
import { default as SwitchComp } from 'rc-switch'
import { IProps } from './types'
import './styles.scss'

const Switch: React.SFC<IProps> = ({ checked, onChange, toggleDisable }) => (
  <SwitchComp
    checked={checked}
    prefixCls="spon-switch"
    onChange={onChange}
    disabled={toggleDisable}
  />
)
Switch.defaultProps = {
  toggleDisable: false
}

export default Switch
