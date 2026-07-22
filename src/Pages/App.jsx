import { Outlet } from "react-router-dom";
import Navbar from "../component/Navbar/Navbar.jsx";
import Footer from "../component/footer/footer.jsx";

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
      <Footer></Footer>
    </>
  );
}

export default App;