// src/redux/calendarSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface HealthRecord {
  id: number;
  recordDate: string;
  symptom: string;
  medication: string;
  severity?: number;
  dosage?: string;
}

interface CalendarState {
  records: HealthRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  records: [],
  loading: false,
  error: null,
};

// Асинхронный запрос на получение данных
export const fetchHealthRecords = createAsyncThunk(
  'calendar/fetchHealthRecords',
  async ({ userId, recordDate }: { userId: number; recordDate: string }) => {
    const response = await axios.get(`/api/healthRecords/${userId}/${recordDate}`);
    return response.data; // Данные из БД
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
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
        state.records = action.payload;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default calendarSlice.reducer;
