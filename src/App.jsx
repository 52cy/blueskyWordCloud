import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import './App.css'

function App() {
  const [session, setSession] = useState(null);

  return (
    <div className="App">
      {!session ? (
        <Login onLogin={setSession} />
      ) : (
        <Dashboard session={session} />
      )}
    </div>
  )
}

export default App
