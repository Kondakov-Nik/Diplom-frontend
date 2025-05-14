import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';

// Интерфейсы (оставляем без изменений)
export interface Symptom {
  id: number;
  name: string;
}

export interface Medication {
  id: number;
  name: string;
  isCustom: boolean;
}

export interface KpIndexData {
  date: string;
  kpIndex: number | null;
}

interface NewSymptomRecord {
  recordDate: string;
  weight: number;
  notes: string | null;
  userId: string;
  symptomId: number;
}

interface NewMedicationRecord {
  recordDate: string;
  dosage: number | null;
  notes: string | null;
  userId: string;
  medicationId: number;
}

interface NewAnalysisRecord {
  title: string;
  recordDate: string;
  userId: string;
  file: File;
}

interface UpdateRecord {
  id: string;
  recordDate?: string;
  weight?: number;
  dosage?: number | null | undefined;
  notes?: string | null;
  userId: string;
  symptomId?: number;
  medicationId?: number;
}

export interface Analysis {
  id: number;
  title: string;
  filePath: string;
  recordDate: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarState {
  events: any[];
  symptoms: Symptom[];
  medications: Medication[];
  analyses: Analysis[];
  kpData: KpIndexData[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  events: [],
  symptoms: [],
  medications: [],
  analyses: [],
  kpData: [],
  loading: false,
  error: null,
};

const token = Cookies.get('authToken');

// Существующие thunk (оставляем без изменений)
export const getAllHealthRecords = createAsyncThunk(
  'calendar/getAllHealthRecords',
  async (userId: string) => {
    const response = await axios.get(`http://localhost:5001/api/healthRecords/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const getAllSymptoms = createAsyncThunk(
  'calendar/getAllSymptoms',
  async (userId: string) => {
    const response = await axios.get<Symptom[]>(`http://localhost:5001/api/symptom/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const getAllMedications = createAsyncThunk(
  'calendar/getAllMedications',
  async (userId: string) => {
    const response = await axios.get<Medication[]>(`http://localhost:5001/api/medication/all/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const getHistoricalKpData = createAsyncThunk(
  'calendar/getHistoricalKpData',
  async ({ start, end }: { start: string; end: string }) => {
    const response = await axios.get('http://localhost:5001/api/kp-index', {
      params: { start, end },
    });
    return response.data as KpIndexData[];
  }
);

export const getForecastKpData = createAsyncThunk(
  'calendar/getForecastKpData',
  async () => {
    const response = await axios.get('http://localhost:5001/api/kp-index/forecast');
    return response.data as KpIndexData[];
  }
);

export const createSymptomRecord = createAsyncThunk(
  'calendar/createSymptomRecord',
  async (newRecord: NewSymptomRecord) => {
    const response = await axios.post(`http://localhost:5001/api/healthRecords/symptoms`, newRecord, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const createMedicationRecord = createAsyncThunk(
  'calendar/createMedicationRecord',
  async (newRecord: NewMedicationRecord) => {
    const response = await axios.post(`http://localhost:5001/api/healthRecords/medications`, newRecord, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const createCustomSymptom = createAsyncThunk(
  'calendar/createCustomSymptom',
  async (newSymptom: { name: string; description: string; isCustom: boolean; userId: string }) => {
    const response = await axios.post(`http://localhost:5001/api/symptom`, newSymptom, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

export const createCustomMedication = createAsyncThunk(
  'calendar/createCustomMedication',
  async (newMedication: { name: string; description: string; isCustom: boolean; userId: string }) => {
    const response = await axios.post(`http://localhost:5001/api/medication`, newMedication, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return response.data;
  }
);

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

export const deleteRecord = createAsyncThunk(
  'calendar/deleteRecord',
  async (id: string) => {
    const response = await axios.delete(`http://localhost:5001/api/healthRecords/${id}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return { id, message: response.data.message };
  }
);

// Новые thunk с типизацией rejectValue
export const getUserAnalyses = createAsyncThunk<
  Analysis[],
  string,
  { rejectValue: string | { message: string } }
>(
  'calendar/getUserAnalyses',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Analysis[]>(`http://localhost:5001/api/analysis/user/${userId}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить анализы');
    }
  }
);

export const createAnalysis = createAsyncThunk<
  any,
  FormData,
  { rejectValue: string | { message: string } }
>(
  'calendar/createAnalysis',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`http://localhost:5001/api/analysis/upload`, formData, {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать анализ');
    }
  }
);

export const deleteAnalysis = createAsyncThunk<
  { id: string; message: string },
  string,
  { rejectValue: string | { message: string } }
>(
  'calendar/deleteAnalysis',
  async (analysisId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`http://localhost:5001/api/analysis/${analysisId}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      return { id: analysisId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось удалить анализ');
    }
  }
);

export const downloadAnalysisFile = createAsyncThunk<
  { id: string; message: string },
  string,
  { rejectValue: string | { message: string } }
>(
  'calendar/downloadAnalysisFile',
  async (analysisId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/analysis/file/${analysisId}`, {
        headers: { Authorization: 'Bearer ' + token },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis_${analysisId}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { id: analysisId, message: 'Файл скачан' };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось скачать файл');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Существующие обработчики (оставляем без изменений)
      .addCase(getAllHealthRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllHealthRecords.fulfilled, (state, action) => {
        state.loading = false;
        // Сохраняем существующие события типа 'analysis'
        const existingAnalyses = state.events.filter((event) => event.extendedProps.type === 'analysis');
        // Обновляем события симптомов и лекарств
        const newEvents = action.payload.map((record: any) => {
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
        state.events = [...newEvents, ...existingAnalyses];
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
      .addCase(getHistoricalKpData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHistoricalKpData.fulfilled, (state, action) => {
        state.loading = false;
        state.kpData = [
          ...action.payload,
          ...state.kpData.filter((d) => !action.payload.some((h) => h.date === d.date)),
        ];
      })
      .addCase(getHistoricalKpData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить исторические данные KP-индекса';
      })
      .addCase(getForecastKpData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getForecastKpData.fulfilled, (state, action) => {
        state.loading = false;
        state.kpData = [
          ...state.kpData.filter((d) => !action.payload.some((f) => f.date === d.date)),
          ...action.payload,
        ];
      })
      .addCase(getForecastKpData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось загрузить прогнозные данные KP-индекса';
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
        state.error = null;
      })
      .addCase(createCustomMedication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось создать лекарство';
      })
      .addCase(deleteRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter((event) => event.id !== action.payload.id);
      })
      .addCase(deleteRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Не удалось удалить запись';
      })
      // Новые обработчики для анализов
      .addCase(getUserAnalyses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserAnalyses.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses = action.payload;
        // Фильтруем существующие события, чтобы избежать дублирования анализов
        state.events = state.events.filter((event) => event.extendedProps.type !== 'analysis');
        // Добавляем новые анализы
        state.events = [
          ...state.events,
          ...action.payload.map((analysis: Analysis) => ({
            id: String(analysis.id),
            title: `Анализ: ${analysis.title}`,
            start: analysis.recordDate,
            allDay: true,
            extendedProps: {
              type: 'analysis',
              filePath: analysis.filePath,
            },
          })),
        ];
      })
      .addCase(getUserAnalyses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message: string })?.message || 'Не удалось загрузить анализы';
      })
      .addCase(createAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses.push(action.payload.analysis);
        // Удаляем старые анализы из событий, чтобы избежать дублирования
        state.events = state.events.filter((event) => event.extendedProps.type !== 'analysis');
        // Добавляем все анализы заново, включая новый
        state.analyses.forEach((analysis) => {
          state.events.push({
            id: String(analysis.id),
            title: `Анализ: ${analysis.title}`,
            start: analysis.recordDate,
            allDay: true,
            extendedProps: {
              type: 'analysis',
              filePath: analysis.filePath,
            },
          });
        });
      })
      .addCase(createAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message: string })?.message || 'Не удалось создать анализ';
      })
      .addCase(deleteAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses = state.analyses.filter((analysis) => analysis.id !== parseInt(action.payload.id));
        state.events = state.events.filter((event) => event.id !== parseInt(action.payload.id));
      })
      .addCase(deleteAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message: string })?.message || 'Не удалось удалить анализ';
      })
      .addCase(downloadAnalysisFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadAnalysisFile.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(downloadAnalysisFile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message: string })?.message || 'Не удалось скачать файл';
      });
  },
});

export default calendarSlice.reducer;