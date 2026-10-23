import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

const Homepage = lazy(() => import("./pages/Homepage"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BoardListPage = lazy(() => import("./pages/BoardListPage"));
const KanbanBoard = lazy(() => import("./pages/KanbanBoard"));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth"
            element={<Navigate to="/auth/signin" replace />}
          />

          <Route
            path="/auth/:mode"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <MeetingRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/board"
            element={
              <ProtectedRoute>
                <BoardListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/board/:boardId"
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
