import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../component/Navbar/Navbar.jsx'


function App() {

  return (
    <>
      <Navbar />
      <Outlet />
      <footer></footer>
    </>
  )
}

export default App;
