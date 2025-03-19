import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import Login from "./Login/Login";
import Signup from "./Signup/Signup";
import CRM_Dashboard from "./Dashboards/CRM_Dashboard/CRM_Dashboard";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './index.css';


function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<h1>Home Page</h1>} /> */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/crm" element={<CRM_Dashboard />} />
      </Routes>
    </Router>
  );
}
export default App
