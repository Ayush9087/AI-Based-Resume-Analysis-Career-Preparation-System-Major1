import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ResumeAnalysisPage = lazy(() => import('../pages/ResumeAnalysisPage'));
const SkillGapPage = lazy(() => import('../pages/SkillGapPage'));
const CareerRecommendationsPage = lazy(() => import('../pages/CareerRecommendationsPage'));
const InterviewPreparationPage = lazy(() => import('../pages/InterviewPreparationPage'));
const MockInterviewPage = lazy(() => import('../pages/MockInterviewPage'));
const ProgressPage = lazy(() => import('../pages/ProgressPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UpdatePasswordPage = lazy(() => import('../pages/UpdatePasswordPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500" role="status">Loading page...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/update-password"
          element={
            <ProtectedRoute>
              <UpdatePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-analysis"
          element={
            <ProtectedRoute>
              <ResumeAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute>
              <SkillGapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/career-recommendations"
          element={
            <ProtectedRoute>
              <CareerRecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-preparation"
          element={
            <ProtectedRoute>
              <InterviewPreparationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <MockInterviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
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
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
