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

// Интерфейс для обновления записи
interface UpdateRecord {
  id: string;
  recordDate?: string;
  weight?: number;
  dosage?: number;
  notes?: string | null;
  userId: string;
  symptomId?: number;
  medicationId?: number;
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

const token = Cookies.get('authToken');

// Thunk для получения всех записей HealthRecord по userId
export const getAllHealthRecords = createAsyncThunk(
  'calendar/getAllHealthRecords',
  async (userId: string) => {
    const response = await axios.get(`http://localhost:5001/api/healthRecords/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для получения всех симптомов по userId
export const getAllSymptoms = createAsyncThunk(
  'calendar/getAllSymptoms',
  async (userId: string) => {
    const response = await axios.get<Symptom[]>(`http://localhost:5001/api/symptom/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для получения всех лекарств по userId
export const getAllMedications = createAsyncThunk(
  'calendar/getAllMedications',
  async (userId: string) => {
    const response = await axios.get<Medication[]>(`http://localhost:5001/api/medication/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для создания записи о симптоме
export const createSymptomRecord = createAsyncThunk(
  'calendar/createSymptomRecord',
  async (newRecord: NewSymptomRecord) => {
    const response = await axios.post(`http://localhost:5001/api/healthRecords/symptoms`, newRecord, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для создания записи о лекарстве
export const createMedicationRecord = createAsyncThunk(
  'calendar/createMedicationRecord',
  async (newRecord: NewMedicationRecord) => {
    const response = await axios.post(`http://localhost:5001/api/healthRecords/medications`, newRecord, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для добавления нового симптома
export const createCustomSymptom = createAsyncThunk(
  'calendar/createCustomSymptom',
  async (newSymptom: { name: string; description: string; isCustom: boolean; userId: string }) => {
    const response = await axios.post(`http://localhost:5001/api/symptom`, newSymptom, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для добавления нового лекарства
export const createCustomMedication = createAsyncThunk(
  'calendar/createCustomMedication',
  async (newMedication: { name: string; description: string; isCustom: boolean; userId: string }) => {
    const response = await axios.post(`http://localhost:5001/api/medication`, newMedication, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

// Thunk для обновления записи
export const updateRecord = createAsyncThunk(
  'calendar/updateRecord',
  async (updatedRecord: UpdateRecord) => {
    const response = await axios.put(
      `http://localhost:5001/api/healthRecords/${updatedRecord.id}`,
      updatedRecord,
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
        state.loading = false;
        state.events = action.payload.map((record: any) => {
          let title = '';
          const recordDate = new Date(record.recordDate);
          const time = recordDate.toTimeString().slice(0, 5);
          if (record.symptom) {
            title = `${record.symptom.name}`;
          } else if (record.medication) {
            title = `${record.medication.name}`;
          }
          return {
            id: record.id,
            title: title,
            start: record.recordDate,
            allDay: false,
            extendedProps: {
              type: record.symptom ? 'symptom' : 'medication',
              notes: record.notes,
              weight: record.weight,
              dosage: record.dosage,
              symptomId: record.symptomId,
              medicationId: record.medicationId,
            },
          };
        });
      })
      .addCase(getAllHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить записи';
      })
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
      })
      .addCase(updateRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecord.fulfilled, (state, action) => {
        state.loading = false;
        const updatedEvent = action.payload;
        const index = state.events.findIndex((event) => event.id === updatedEvent.id);
        if (index !== -1) {
          const recordDate = new Date(updatedEvent.recordDate);
          const time = recordDate.toTimeString().slice(0, 5);
          let title = '';
          if (updatedEvent.symptom) {
            title = `Симптом: ${updatedEvent.symptom.name} - ${time} - Тяжесть: ${updatedEvent.weight}`;
          } else if (updatedEvent.medication) {
            title = `Лекарство: ${updatedEvent.medication.name} - ${time} - Количество: ${updatedEvent.notes || ''} - Дозировка: ${updatedEvent.dosage || ''} мг`;
          }
          state.events[index] = {
            ...state.events[index],
            title: title,
            start: updatedEvent.recordDate,
            extendedProps: {
              ...state.events[index].extendedProps,
              weight: updatedEvent.weight,
              dosage: updatedEvent.dosage,
              notes: updatedEvent.notes,
              symptomId: updatedEvent.symptomId,
              medicationId: updatedEvent.medicationId,
            },
          };
        }
      })
      .addCase(updateRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось обновить запись';
      })
      .addCase(createCustomSymptom.fulfilled, (state, action) => {
        state.symptoms.push(action.payload);
      })
      .addCase(createCustomMedication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomMedication.fulfilled, (state, action) => {
        state.loading = false;
        state.medications.push(action.payload);
      })
      .addCase(createCustomMedication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось создать лекарство';
      });
  },
});

export default calendarSlice.reducer;