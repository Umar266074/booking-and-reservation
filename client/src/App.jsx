import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoutes";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResourceListPage from "./pages/ResourceListPage";
import ResourceDetail from "./pages/ResourceDetail";
import BookingLists from "./pages/BookingLists";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/resources" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/resources" element={<ProtectedRoute><ResourceListPage /></ProtectedRoute>} />
        <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><BookingLists /></ProtectedRoute>} />
      </Routes>
    </>
  );
}