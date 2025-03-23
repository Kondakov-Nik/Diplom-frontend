import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

// Тип для записи здоровья, основанный на вашем контроллере
interface HealthRecord {
  id: number;
  weight: number | null;
  symptomId: number | null;
  medicationId: number | null;
  dosage: string | null;
  recordDate: string;
  notes: string | null;
  symptom?: { name: string };
  medication?: { name: string };
}

// Тип для состояния слайса
interface MainState {
  healthRecords: HealthRecord[];
  loading: boolean;
  error: string | null;
}

// Тип для ошибки от API
interface ApiError {
  message: string;
}

// Начальное состояние
const initialState: MainState = {
  healthRecords: [],
  loading: false,
  error: null,
};

// Асинхронное действие для получения записей здоровья
export const fetchHealthRecords = createAsyncThunk(
  'main/fetchHealthRecords',
  async (userId: string, { rejectWithValue }) => {
    try {
    const response = await axios.get(`http://localhost:5001/api/healthRecords/all/${userId}`);
      if (!Array.isArray(response.data)) {
        throw new Error('Данные от API не являются массивом');
      }
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Ошибка при получении записей здоровья'
      );
    }
  }
);

const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.healthRecords = action.payload; // Уже гарантированно массив
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.healthRecords = []; // Сбрасываем на пустой массив в случае ошибки
      });
  },
});

export default mainSlice.reducer;