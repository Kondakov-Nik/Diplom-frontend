import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

// Тип для записи здоровья
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

// Тип для данных KP-индекса
interface KpIndexData {
  date: string;
  kpIndex: number | null;
}

// Тип для состояния слайса
interface MainState {
  healthRecords: HealthRecord[];
  kpIndexData: KpIndexData[]; // Заменяем kpIndexToday на массив данных за три дня
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
  kpIndexData: [],
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

// Новый thunk для получения KP-индекса за три дня
export const fetchKpIndexForThreeDays = createAsyncThunk(
  'main/fetchKpIndexForThreeDays',
  async (_, { rejectWithValue }) => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // Сегодня
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 2); // Через два дня
      const endDateStr = endDate.toISOString().split('T')[0];

      // Запрос исторических данных
      const historicalResponse = await axios.get('http://localhost:5001/api/kp-index', {
        params: { start: startDate, end: endDateStr },
      });
      const historicalData = historicalResponse.data as KpIndexData[];

      // Запрос прогнозных данных
      const forecastResponse = await axios.get('http://localhost:5001/api/kp-index/forecast');
      const forecastData = forecastResponse.data as KpIndexData[];

      // Формируем данные за три дня
      const kpData: KpIndexData[] = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const historicalEntry = historicalData.find((entry) => entry.date === dateStr);
        if (historicalEntry && historicalEntry.kpIndex !== null) {
          kpData.push(historicalEntry);
        } else {
          const forecastEntry = forecastData.find((entry) => entry.date === dateStr);
          kpData.push(forecastEntry || { date: dateStr, kpIndex: null });
        }
      }

      return kpData;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Ошибка при получении KP-индекса'
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
        state.healthRecords = action.payload;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.healthRecords = [];
      })
      .addCase(fetchKpIndexForThreeDays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKpIndexForThreeDays.fulfilled, (state, action) => {
        state.loading = false;
        state.kpIndexData = action.payload;
      })
      .addCase(fetchKpIndexForThreeDays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default mainSlice.reducer;