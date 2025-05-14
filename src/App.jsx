import { useState } from 'react'
import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router';

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
// import Report from './pages/Report'
// import MapView from './pages/MapView'
import Leaderboard from './pages/Leaderboard'
import NotFound from './pages/NotFound'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user-dashboard/:id" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* <Route path="/report" element={<Report />} /> */}
          {/* <Route path="/map-view" element={<MapView />} /> */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
