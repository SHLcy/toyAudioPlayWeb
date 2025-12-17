import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DeviceList from './pages/DeviceList'
import AddDevice from './pages/AddDevice'

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/devices',
    element: (
      <ProtectedRoute>
        <DeviceList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/add-device',
    element: (
      <ProtectedRoute>
        <AddDevice />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/devices" replace />,
  },
])

