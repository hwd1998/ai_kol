import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { api } from '../services/api';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
}

export interface UserState {
  loading: boolean;
  error: string | null;
  accessToken: string | null;
}

const initialState: UserState = {
  loading: false,
  error: null,
  accessToken: localStorage.getItem('accessToken'),
};

export const register = createAsyncThunk<RegisterResponse, RegisterRequest, { rejectValue: string }>(
  'user/register',
  async (payload, thunkApi) => {
    try {
      const res = await api.post<RegisterResponse>('/user/register', payload);
      return res.data;
    } catch (err) {
      // 简体中文注释：避免隐式 any，按 Axios 常见结构做安全兜底
      const message = err instanceof Error ? err.message : '注册失败';
      return thunkApi.rejectWithValue(message);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      localStorage.removeItem('accessToken');
    },
    setToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? '注册失败';
      });
  },
});

export const { logout, setToken } = userSlice.actions;
export const userReducer = userSlice.reducer;

