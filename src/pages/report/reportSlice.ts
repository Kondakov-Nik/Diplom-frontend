import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie'; // Импортируем библиотеку для работы с cookies

interface ReportState {
  report: { filePath: string } | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  report: null,
  loading: false,
  error: null,
};

// Тип для декодирования JWT
interface DecodedToken {
  id: string;
}

export const generateReport = createAsyncThunk(
  'report/generateReport',
  async ({ startDate, endDate, reportType }: { startDate: string, endDate: string, reportType: string }) => {
    
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const url = reportType === 'symptoms'
      ? 'http://localhost:5001/api/reports/symptoms'  // URL для симптомов
      : 'http://localhost:5001/api/reports/medications'; // URL для лекарств


    // Получаем токен из cookies
    const token = Cookies.get('authToken');  // Извлекаем токен из cookies

    let userId = '';
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);  // Декодируем токен
      userId = decoded.id;  // Извлекаем id и переименовываем его в userId
      console.log('Извлечённый userId из токена:', userId);
    } else {  
      console.log('Токен не найден в cookies');
    }

    // Делаем запрос с userId
    const response = await axios.post(url, {
      userId, // Передаем userId из токена
      startDate,
      endDate,
    });

    return response.data;
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(generateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.loading = false;
        state.report = action.payload; // Получаем путь к PDF
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Что-то пошло не так';
      });
  },
});

export default reportSlice.reducer;
