import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface HealthRecord {
  symptom: { name: string } | null;
  medication: { name: string } | null;
}

interface AIState {
  conversation: Message[];
  healthRecords: HealthRecord[];
  isInitial: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  conversation: [],
  healthRecords: [],
  isInitial: true,
  loading: false,
  error: null,
};

export const fetchHealthData = createAsyncThunk(
  'ai/fetchHealthData',
  async ({ userId, startDate, endDate }: { userId: number; startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5001/api/ai/health-data', { userId, startDate, endDate });
      return response.data.records;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при получении данных о здоровье');  
    }
  }
);

export const sendPrompt = createAsyncThunk(
  'ai/sendPrompt',
  async (messages: Message[], { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5001/api/ai/chat', { messages });

      let gptResponse: string;
      if (typeof response.data === 'string') {
        gptResponse = response.data;
      } else if (response.data.response) {
        gptResponse = response.data.response;
      } else if (response.data.message) {
        gptResponse = response.data.message;
      } else if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        gptResponse = response.data.choices[0].message.content;
      } else if (response.data.content) {
        gptResponse = response.data.content;
      } else if (response.data.conversation && Array.isArray(response.data.conversation)) {
        const assistantMessage = response.data.conversation.find((msg: Message) => msg.role === 'assistant');
        if (assistantMessage && assistantMessage.content) {
          gptResponse = assistantMessage.content;
        } else {
          throw new Error('Ответ от GPT не найден в conversation');
        }
      } else {
        throw new Error('Неизвестный формат ответа от API');
      }

      return gptResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка при отправке запроса');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    resetChat: (state) => {
      state.conversation = [];
      state.healthRecords = [];
      state.isInitial = true;
      state.loading = false;
      state.error = null;
    },
    addMessage: (state, action) => {
      state.conversation.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthData.fulfilled, (state, action) => {
        state.loading = false;
        state.healthRecords = action.payload;
      })
      .addCase(fetchHealthData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPrompt.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitial = false;
        state.conversation.push({ role: 'assistant' as const, content: action.payload });
      })
      .addCase(sendPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetChat, addMessage } = aiSlice.actions;
export default aiSlice.reducer;