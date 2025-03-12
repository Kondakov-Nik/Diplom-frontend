// src/store/calendarSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';

interface CalendarState {
  events: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  events: [],
  loading: false,
  error: null,
};

const token = Cookies.get('authToken'); // Извлекаем токен из cookies

// Асинхронный thunk для получения всех записей HealthRecord по userId
export const getAllHealthRecords = createAsyncThunk(
  'calendar/getAllHealthRecords',
  async (userId: string) => {
    const response = await axios.get(
      `http://localhost:5001/api/healthRecords/all/${userId}`,
      {
        headers: { Authorization: 'Bearer ' + token },
      }
    );
    return response.data;
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllHealthRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllHealthRecords.fulfilled, (state, action) => {
        console.log('Полученные данные для событий:', action.payload);  // Логируем данные

        state.loading = false;
        state.events = action.payload.map((record: any) => {
          // Проверяем тип записи и создаем title
          let title = '';
          
          if (record.symptom) {
            title = `Симптом: ${record.symptom.name}`;
          } else if (record.medication) {
            title = `Лекарство: ${record.medication.name} - Дозировка: ${record.dosage || ''}`;
          }

          // Возвращаем событие с уникальным id и нужными свойствами
          return {
            id: record.id,  // Используем id из базы данных
            title: title,
            start: record.recordDate,  // Начало события
            allDay: true,  // Все события - целый день
            extendedProps: {
              type: record.symptom ? 'symptom' : 'medication',
              notes: record.notes,  // Дополнительные данные
              weight: record.weight,
              dosage: record.dosage,
            },
          };
        });
      })
      .addCase(getAllHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить записи';
      });
  },
});

export default calendarSlice.reducer;
