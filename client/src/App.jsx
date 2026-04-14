import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import ProjectView from './pages/ProjectView';
import ProjectOverview from './pages/ProjectOverview';
import NoteEditor from './pages/NoteEditor';
import Leaderboard from './pages/Leaderboard';
import NexusSearch from './pages/NexusSearch';
import ResearchHistory from './pages/ResearchHistory';
import Chat from './pages/Chat';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
import AdminGovernance from './pages/AdminGovernance';
import AiTutor from './pages/AiTutor';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const AppLayout = ({ children, onSearchOpen }) => {
  return (
    <div className="app-layout">
      <Sidebar onSearchOpen={onSearchOpen} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <BrowserRouter>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/project/:id" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <ProjectView />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/project/:id/preview" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <ProjectOverview />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <Leaderboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/search" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <NexusSearch />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/research-history" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <ResearchHistory />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <Chat />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/note/:id" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <NoteEditor />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <AdminPanel />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/governance" element={
          <ProtectedRoute adminOnly={true}>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <AdminGovernance />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/ai-tutor" element={
          <ProtectedRoute>
            <AppLayout onSearchOpen={() => setIsSearchOpen(true)}>
              <AiTutor />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
