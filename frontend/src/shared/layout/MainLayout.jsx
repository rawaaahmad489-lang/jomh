import { Outlet, Link } from "react-router-dom";

export default function MainLayout() {
  return (
    <div>
      <nav style={{ padding: "10px", background: "#eee" }}>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link>
      </nav>

      <div style={{ padding: "0px" }}>
        <Outlet />
      </div>
    </div>
  );
}