import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import availabilityReducer from './slices/availabilitySlice';
import bookingReducer from './slices/bookingSlice';
import resourceReducer from './slices/resourceSlice';
import userRoleReducer from './slices/userRoleSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        availability: availabilityReducer,
        bookings: bookingReducer,
        resources: resourceReducer,
        userRole: userRoleReducer,
    }
})




