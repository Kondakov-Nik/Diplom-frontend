import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';


interface UserState {
  username: string;
  birthDate: string;
  age: number;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  username: '',
  birthDate: '',
  age: 0,
  loading: false,
  error: null,
};

const token = Cookies.get('authToken');  // Извлекаем токен из cookies


export const getUserData = createAsyncThunk('personalpage/getUserData', async (userId: string) => {
// Отправляем запрос с токеном в заголовке
  const response = await axios.get(`http://localhost:5001/api/user/${userId}`, {
    headers: { 'Authorization': 'Bearer ' + token}
  });  
  return response.data;
});

const personalPageSlice = createSlice({
  name: 'personalPage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.username = action.payload.username;
        state.birthDate = action.payload.birthDate;
        state.age = action.payload.age;
      })
      .addCase(getUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить данные';
      });
  },
});

export default personalPageSlice.reducer;
