import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getBookingAPI,
  getBookingByIdAPI,
  addBookingAPI,
  editBookingAPI,
  deleteBookingByIdAPI,
} from "../../services/bookingsServices";

import getError from "../../utils/getErrors";

export const fetchBookings = createAsyncThunk(
  "bookings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getBookingAPI();
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  "bookings/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await getBookingByIdAPI(id);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const addBooking = createAsyncThunk(
  "bookings/add",
  async (data, { rejectWithValue }) => {
    try {
      return await addBookingAPI(data);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const editBookings = createAsyncThunk(
  "bookings/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await editBookingAPI(id, data);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const deleteBookings = createAsyncThunk(
  "bookings/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteBookingByIdAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState: {
    items: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
// All
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
//only 1
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
// Add Booking
      .addCase(addBooking.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addBooking.rejected, (state, action) => {
        state.error = action.payload;
      })
// Edit Booking
      .addCase(editBookings.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(editBookings.rejected, (state, action) => {
        state.error = action.payload;
      })
// Delete Booking
      .addCase(deleteBookings.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteBookings.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default bookingSlice.reducer;