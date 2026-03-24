import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { api } from '../services/api';

export type Role = 'CREATOR' | 'REVIEW' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface AuthState {
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  role: Role | null;
  username: string | null;
}

const tokenFromStorage = localStorage.getItem('accessToken');
const roleFromStorage = localStorage.getItem('role') as Role | null;
const usernameFromStorage = localStorage.getItem('username');

const initialState: AuthState = {
  loading: false,
  error: null,
  accessToken: tokenFromStorage,
  role: roleFromStorage,
  username: usernameFromStorage,
};

function decodeRoleFromJwt(token: string): { role: Role | null; username: string | null } {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return { role: null, username: null };
    const json = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: Role;
      username?: string;
    };
    return {
      role: json.role ?? null,
      username: json.username ?? null,
    };
  } catch {
    return { role: null, username: null };
  }
}

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (payload, thunkApi) => {
    try {
      const res = await api.post<LoginResponse>('/auth/login', payload);
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败';
      return thunkApi.rejectWithValue(msg);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.role = null;
      state.username = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
    },
    setProfileUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
      localStorage.setItem('username', action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        const decoded = decodeRoleFromJwt(action.payload.accessToken);
        state.role = decoded.role;
        state.username = decoded.username;
        localStorage.setItem('accessToken', action.payload.accessToken);
        if (decoded.role) localStorage.setItem('role', decoded.role);
        if (decoded.username) localStorage.setItem('username', decoded.username);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? '登录失败';
      });
  },
});

export const { logout, setProfileUsername } = authSlice.actions;
export const authReducer = authSlice.reducer;

