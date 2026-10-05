import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getResourcesAPI,
  getResourcesByIdAPI,
  addResourcesAPI,
  editResourcesAPI,
  deleteResourcesByIdAPI,
} from "../../services/resourceServices";

import getError from "../../utils/getErrors";

export const fetchResources = createAsyncThunk(
  "resources/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getResourcesAPI();
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const fetchResourceById = createAsyncThunk(
  "resources/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await getResourcesByIdAPI(id);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const addResource = createAsyncThunk(
  "resources/add",
  async (data, { rejectWithValue }) => {
    try {
      return await addResourcesAPI(data);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const editResource = createAsyncThunk(
  "resources/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await editResourcesAPI(id, data);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const deleteResource = createAsyncThunk(
  "resources/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteResourcesByIdAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const resourceSlice = createSlice({
  name: "resources",
  initialState: {
    items: [],  
    selected: null, 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
// only one
      .addCase(fetchResourceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResourceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchResourceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
// add
      .addCase(addResource.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addResource.rejected, (state, action) => {
        state.error = action.payload;
      })
// edit
      .addCase(editResource.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(editResource.rejected, (state, action) => {
        state.error = action.payload;
      })
// delete
      .addCase(deleteResource.fulfilled, (state, action) => {
        const item = state.items.find((r) => r.id === action.payload);
        if (item) item.is_active = 0;
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default resourceSlice.reducer;