import type { Action, ThunkAction } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import authSlice from '../features/authForm/authSlice';
import reportSlice from '../pages/report/reportSlice';
import personalpageSlice from '../pages/personalpage/personalpageSlice';
import calendarSlice from '../pages/calendar/calendarSlice';
import mainSlice from '../pages/main/mainSlice';
import aiSlice from '../pages/ai/aiSlice';



const rootReducers = combineReducers({
  reportSlice,
  authSlice,
  personalpageSlice,
  calendarSlice,
  mainSlice,
  aiSlice
})


export const store = configureStore({
  reducer: rootReducers
})

// Infer the type of `store`
export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore['dispatch']
// Define a reusable type describing thunk functions
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>