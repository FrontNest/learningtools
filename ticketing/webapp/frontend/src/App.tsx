import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { TicketListPage } from "./pages/TicketListPage";
import { NewTicketPage } from "./pages/NewTicketPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { AdminTeamsPage } from "./pages/AdminTeamsPage";
import { AdminWorkflowSettingsPage } from "./pages/AdminWorkflowSettingsPage";
import { AdminDevicesPage } from "./pages/AdminDevicesPage";
import { AdminEmailSettingsPage } from "./pages/AdminEmailSettingsPage";
import { BrowserNotificationWatcher } from "./components/BrowserNotificationWatcher";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrowserNotificationWatcher />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminTeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDevicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/email-settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminEmailSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workflow-settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminWorkflowSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TicketListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute>
                <NewTicketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
