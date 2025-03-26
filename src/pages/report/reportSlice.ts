import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';

interface ReportState {
  reportId: number | null;
  reports: Array<{ id: number, type: string, startDate: string, endDate: string, createdAt: string }>;
  selectedReportId: number | null;
  selectedReportUrl: string | null; // Добавляем URL для отображения PDF
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  reportId: null,
  reports: [],
  selectedReportId: null,
  selectedReportUrl: null,
  loading: false,
  error: null,
};

interface DecodedToken {
  id: string;
}

export const generateReport = createAsyncThunk(
  'report/generateReport',
  async ({ startDate, endDate, reportType }: { startDate: string, endDate: string, reportType: string }, { rejectWithValue }) => {
    try {
      const url = reportType === 'symptoms'
        ? 'http://localhost:5001/api/reports/symptoms'
        : 'http://localhost:5001/api/reports/medications';

      const token = Cookies.get('authToken');
      if (!token) throw new Error('Токен не найден в cookies');

      const decoded: DecodedToken = jwtDecode(token);
      const userId = decoded.id;

      const response = await axios.post(url, { userId, startDate, endDate }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.reportId;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Ошибка при создании отчета');
      }
      return rejectWithValue(error || 'Что-то пошло не так');
    }
  }
);

export const fetchUserReports = createAsyncThunk(
  'report/fetchUserReports',
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Токен не найден в cookies');

      const decoded: DecodedToken = jwtDecode(token);
      const userId = decoded.id;

      const response = await axios.get(`http://localhost:5001/api/reports/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Ошибка при получении отчетов');
      }
      return rejectWithValue(error || 'Что-то пошло не так');
    }
  }
);

// Новый thunk для загрузки PDF-файла
export const fetchReportFile = createAsyncThunk(
  'report/fetchReportFile',
  async (reportId: number, { rejectWithValue }) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Токен не найден в cookies');

      const response = await axios.get(`http://localhost:5001/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Получаем файл как Blob
      });

      // Создаем URL для Blob
      const url = URL.createObjectURL(response.data);
      return url;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Ошибка при загрузке отчета');
      }
      return rejectWithValue(error || 'Что-то пошло не так');
    }
  }
);


// Асинхронный экшен для удаления отчета
export const deleteReport = createAsyncThunk(
  'report/deleteReport',
  async (reportId: number, { rejectWithValue }) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Токен не найден');

      await axios.delete(`http://localhost:5001/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return reportId; // Возвращаем ID удаленного отчета
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Ошибка при удалении');
      }
      return rejectWithValue(error || 'Что-то пошло не так');
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setSelectedReport: (state, action) => {
      state.selectedReportId = action.payload;
    },
    clearSelectedReportUrl: (state) => {
      if (state.selectedReportUrl) {
        URL.revokeObjectURL(state.selectedReportUrl); // Освобождаем память
        state.selectedReportUrl = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportId = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchReportFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportFile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReportUrl = action.payload;
      })
      .addCase(fetchReportFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = state.reports.filter(report => report.id !== action.payload);
        if (state.selectedReportId === action.payload) {
          state.selectedReportId = null;
          state.selectedReportUrl = null;
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedReport, clearSelectedReportUrl } = reportSlice.actions;
export default reportSlice.reducer;