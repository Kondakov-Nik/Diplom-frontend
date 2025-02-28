import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { userApi } from '../../api';
import { CreateUserDto, loginDto } from '../../types/types';

interface AuthState {
    token: string | null;
    error: string | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    token: null,
    error: '',
    loading: false,
    isAuthenticated: false
};

export const loginUser = createAsyncThunk('user/login', async (dto: loginDto) => {
  try {
    const response = await userApi.login(dto);
    return response.token;
  } catch (error:any) {
    // Если ошибка имеет ответ от сервера
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message); 
    }
    throw new Error('Что-то пошло не так'); 
  }
});

export const registerUser = createAsyncThunk('user/register', async (dto: CreateUserDto) => {
  try {
    const response = await userApi.register(dto);
    return response.token;
  } catch (error:any) {
    // Если ошибка имеет ответ от сервера
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message); 
    }
    throw new Error('Что-то пошло не так');
  }
});

export const checkUser = createAsyncThunk('user/fetchUserProfile', async () => {
  const token = Cookies.get('authToken')
  if (token){
    const response = await userApi.getMe(token);
    console.log(111)
    return response.token;
  }else {
    console.log(222)
    throw new Error('Вы не зашли в аккаунт'); 
  }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.token = null;
            state.isAuthenticated = false; // Устанавливаем isAuthenticated в false при выходе
            Cookies.remove('authToken'); 
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload;
          Cookies.set('authToken', action.payload, { expires: 7 }); 
          state.isAuthenticated = true;
        })
        .addCase(loginUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message|| 'Что-то пошло не так';
        })
        .addCase(registerUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload;
          Cookies.set('authToken', action.payload, { expires: 7 }); 
          state.isAuthenticated = true;
        })
        .addCase(registerUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message|| 'Что-то пошло не так';
        })
        .addCase(checkUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(checkUser.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload;
          Cookies.set('authToken', action.payload, { expires: 7 }); 
          state.isAuthenticated = true;
        })
        .addCase(checkUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Что-то пошло не так';
        })
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;