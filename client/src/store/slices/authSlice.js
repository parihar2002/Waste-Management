import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('eco_user') 
  ? JSON.parse(localStorage.getItem('eco_user')) 
  : null;
const storedToken = localStorage.getItem('eco_token') || null;

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('eco_user', JSON.stringify(action.payload.user));
      localStorage.setItem('eco_token', action.payload.token);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('eco_user');
      localStorage.removeItem('eco_token');
    },
    updateUserRewards: (state, action) => {
      if (state.user) {
        state.user.points = action.payload.points;
        state.user.level = action.payload.level;
        state.user.badges = action.payload.badges;
        localStorage.setItem('eco_user', JSON.stringify(state.user));
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserRewards,
  clearError
} = authSlice.actions;

export default authSlice.reducer;
