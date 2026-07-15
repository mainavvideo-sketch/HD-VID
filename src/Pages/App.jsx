import { Outlet } from "react-router-dom";
import Navbar from "../component/Navbar/Navbar.jsx";

function App() {
  const role = localStorage.getItem("role");

  return (
    <>
      <Navbar />
{role === "admin" && (
      <div className="admin-main">
        <div className="admin-content">
          
        <div className="admin-list">
          👑 Admin Logged In
        </div>
     
        </div>
      </div>
       )}
      <Outlet />
      <footer></footer>
    </>
  );
}

export default App;