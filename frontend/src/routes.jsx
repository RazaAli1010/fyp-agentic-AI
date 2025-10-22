import { Navigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";

import Login from "@components/auth/Login";
import Register from "@components/auth/Register";
import ForgotPassword from "@components/auth/ForgotPassword";
import ResetPassword from "@components/auth/ResetPassword";
import Profile from "@components/auth/Profile";

import Dashboard from "@components/project/dashboard";
import ProjectList from "@components/project/ProjectList";
import ProjectCard from "@components/project/projectcard";
import CreateProject from "@components/project/createproject";
import ProjectDetails from "@components/project/projectdetails";
import VersionHistory from "@components/project/versionhistory";

import ChatInterface from "@components/chat/ChatInterface";
import InvestorObjections from "@components/chat/InvestorObjections";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const routes = [
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password/:token",
    element: (
      <PublicRoute>
        <ResetPassword />
      </PublicRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <ProjectList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/create",
    element: (
      <ProtectedRoute>
        <CreateProject />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:projectId",
    element: (
      <ProtectedRoute>
        <ProjectDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:projectId/versions",
    element: (
      <ProtectedRoute>
        <VersionHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <ChatInterface />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat/:chatId",
    element: (
      <ProtectedRoute>
        <ChatInterface />
      </ProtectedRoute>
    ),
  },
  {
    path: "/investor-objections/:projectId",
    element: (
      <ProtectedRoute>
        <InvestorObjections />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
];

export default routes;
