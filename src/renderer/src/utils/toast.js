import { Notyf } from 'notyf'

// Single Notyf instance
const notyf = new Notyf({
  duration: 2000, // auto-dismiss after 3s
  position: { x: 'right', y: 'bottom' },
  ripple: false
})

export const showSuccess = (msg) => notyf.success(msg)
export const showError = (msg) => notyf.error(msg)
export default notyf
