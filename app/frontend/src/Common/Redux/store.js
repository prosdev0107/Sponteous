import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'
import { rootReducer } from './rootReducer'
import { timingSafeEqual } from 'crypto'

function saveToLocalStorage(state) {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('state', serializedState)
  } catch (e) {
    console.log(e)
  }
}

function loadFromLocalStorage() {
  try {
    const serializedState = localStorage.getItem('state')
    if (serializedState === null) return undefined
    return JSON.parse(serializedState)
  } catch (e) {
    console.log(e)
    return undefined
  }
}

const persistedState = loadFromLocalStorage()

const store = createStore(
  rootReducer,
  persistedState,
  composeWithDevTools(applyMiddleware(thunkMiddleware))
)

store.subscribe(() => saveToLocalStorage(store.getState()))

export default store
