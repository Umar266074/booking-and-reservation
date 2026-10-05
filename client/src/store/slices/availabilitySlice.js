import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAvailabilityAPI,
  getAvailabilityByIdAPI,
  addAvailabilityAPI,
  editAvailabilityAPI,
  deleteAvailabilityByIdAPI,
} from "../../services/availabilityServices";
import getError from "../../utils/getErrors";

export const fetchAvailability = createAsyncThunk(
  "availability/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await getAvailabilityAPI(params);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const fetchAvailabilityById = createAsyncThunk(
  "availability/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await getAvailabilityByIdAPI(id);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const addAvailability = createAsyncThunk(
  "availability/add",
  async (data, { rejectWithValue }) => {
    try {
      return await addAvailabilityAPI(data);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const editAvailability = createAsyncThunk(
  "availability/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await editAvailabilityAPI(id, data);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const deleteAvailability = createAsyncThunk(
  "availability/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteAvailabilityByIdAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const availabilitySlice = createSlice({
  name: "availability",
  initialState: {
    items: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAvailabilityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailabilityById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchAvailabilityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addAvailability.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addAvailability.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(editAvailability.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(editAvailability.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteAvailability.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAvailability.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default availabilitySlice.reducer;