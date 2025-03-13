// src/store/calendarSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';

// Интерфейс для симптома
export interface Symptom {
  id: number;
  name: string;
}

// Интерфейс для лекарства
export interface Medication {
  id: number;
  name: string;
  isCustom: boolean;
}

// Интерфейс для новой записи о симптоме
interface NewSymptomRecord {
  recordDate: string;
  weight: number;
  notes: string | null;
  userId: string;
  symptomId: number;
}

// Интерфейс для новой записи о лекарстве
interface NewMedicationRecord {
  recordDate: string;
  dosage: number;
  notes: string | null;
  userId: string;
  medicationId: number;
}

// Интерфейс состояния
interface CalendarState {
  events: any[];
  symptoms: Symptom[];
  medications: Medication[];
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: CalendarState = {
  events: [],
  symptoms: [],
  medications: [],
  loading: false,
  error: null,
};

const token = Cookies.get('authToken'); // Извлекаем токен из cookies

// Thunk для получения всех записей HealthRecord по userId
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

// Thunk для получения всех симптомов по userId
export const getAllSymptoms = createAsyncThunk(
  'calendar/getAllSymptoms',
  async (userId: string) => {
    const response = await axios.get<Symptom[]>(
      `http://localhost:5001/api/symptom/all/${userId}`,
      {
        headers: { Authorization: 'Bearer ' + token },
      }
    );
    return response.data;
  }
);

// Thunk для получения всех лекарств по userId
export const getAllMedications = createAsyncThunk(
  'calendar/getAllMedications',
  async (userId: string) => {
    const response = await axios.get<Medication[]>(
      `http://localhost:5001/api/medication/all/${userId}`,
      {
        headers: { Authorization: 'Bearer ' + token },
      }
    );
    return response.data;
  }
);

// Thunk для создания записи о симптоме
export const createSymptomRecord = createAsyncThunk(
  'calendar/createSymptomRecord',
  async (newRecord: NewSymptomRecord) => {
    const response = await axios.post(
      `http://localhost:5001/api/healthRecords/symptoms`,
      newRecord,
      {
        headers: { Authorization: 'Bearer ' + token },
      }
    );
    return response.data;
  }
);

// Thunk для создания записи о лекарстве
export const createMedicationRecord = createAsyncThunk(
  'calendar/createMedicationRecord',
  async (newRecord: NewMedicationRecord) => {
    const response = await axios.post(
      `http://localhost:5001/api/healthRecords/medications`,
      newRecord,
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
      // Обработка getAllHealthRecords
      .addCase(getAllHealthRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllHealthRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.map((record: any) => {
          let title = '';
          const recordDate = new Date(record.recordDate);
          const time = recordDate.toTimeString().slice(0, 5); // Извлекаем время в формате HH:mm
          if (record.symptom) {
            title = `${record.symptom.name}`;
          } else if (record.medication) {
            title = `${record.medication.name} -${record.notes || ''}х${record.dosage || ''}мг`;
          }
          return {
            id: record.id,
            title: title,
            start: record.recordDate,
            allDay: false, // Устанавливаем allDay в false для всех событий с временем
            extendedProps: {
              type: record.symptom ? 'symptom' : 'medication',
              notes: record.notes,
              weight: record.weight,
              dosage: record.dosage,
            },
          };
        });
      })
      .addCase(getAllHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить записи';
      })
      // Обработка getAllSymptoms
      .addCase(getAllSymptoms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSymptoms.fulfilled, (state, action) => {
        state.loading = false;
        state.symptoms = action.payload;
      })
      .addCase(getAllSymptoms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить симптомы';
      })
      // Обработка getAllMedications
      .addCase(getAllMedications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMedications.fulfilled, (state, action) => {
        state.loading = false;
        state.medications = action.payload;
      })
      .addCase(getAllMedications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить лекарства';
      })
      // Обработка createSymptomRecord
      .addCase(createSymptomRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSymptomRecord.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createSymptomRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось создать запись о симптоме';
      })
      // Обработка createMedicationRecord
      .addCase(createMedicationRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMedicationRecord.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createMedicationRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось создать запись о лекарстве';
      });
  },
});

export default calendarSlice.reducer;