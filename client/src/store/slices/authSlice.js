import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: token || null,
    role: role || null,
    userId: userId ? Number(userId) : null, 
  },
  reducers: {
    setCredentials: (state, action) => {
      const { token, role, userId } = action.payload;
      state.token = token;
      state.role = role;
      state.userId = userId ?? null;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (userId != null) localStorage.setItem("userId", String(userId));
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.userId = null;
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
