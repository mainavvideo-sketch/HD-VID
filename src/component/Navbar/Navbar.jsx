import "./Navbar.css";
import { HouseDoorFill } from "react-bootstrap-icons";
import { Fire } from "react-bootstrap-icons";
import { Link, NavLink } from "react-router-dom";
import hero from "../../assets/logo.png";
import SearchForm from "../searchform/search";
import LogoutButton from "../loguot/loagout";

function Navbar() {
  return (
    <nav>
      <div className="nav">
        <div className="nav-logo">
          <Link to="/">
            <img src={hero} alt="logo" className="rotate" />
          </Link>
          <SearchForm />
        </div>
        <ul>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "home" : "links")}
            >
              <HouseDoorFill />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/trending"
              className={({ isActive }) => (isActive ? "trending" : "links")}
            >
              <Fire />
            </NavLink>
          </li>
          <li className="logout">
            <LogoutButton />
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
