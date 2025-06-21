import { Link, useLocation } from "react-router-dom";

export function NavBar() {
  const location = useLocation();
  return (
    <div className="navbar">
      <Link to="/audio">
        <button className={location.pathname === "/audio" ? "active" : ""}>
          Audio
        </button>
      </Link>
      <Link to="/video">
        <button className={location.pathname === "/video" ? "active" : ""}>
          Video
        </button>
      </Link>
    </div>
  );
}
