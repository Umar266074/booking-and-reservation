import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsersService, updateUserRoleService } from "../../services/userRoleServices";
import getError from "../../utils/getErrors";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllUsersService();
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const updateUserRole = createAsyncThunk(
  "users/updateUserRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      await updateUserRoleService(userId, role);
      return { id: userId, role };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const userRoleSlice = createSlice({
  name: "users",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const user = state.list.find((u) => u.id === action.payload.id);
        if (user) user.role = action.payload.role;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default userRoleSlice.reducer;
