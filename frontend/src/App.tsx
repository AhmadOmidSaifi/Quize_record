import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import JoinPage from './pages/Join'
import TeamRoom from './pages/TeamRoom'
import AdminDashboard from './pages/AdminDashboard'
import CompetitionDetail from './pages/CompetitionDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/room/:code/:teamId" element={<Layout bare><TeamRoom /></Layout>} />
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/join" element={<JoinPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/host" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/host/:id" element={<ProtectedRoute><CompetitionDetail /></ProtectedRoute>} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
