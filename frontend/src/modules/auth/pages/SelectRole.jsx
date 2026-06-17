
import { useNavigate } from "react-router-dom";
import '../../../index.css'

export default function SelectRole() {
  const navigate = useNavigate();

  const chooseRole = (role) => {
    navigate("/register", { state: { role } });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box role-box">
        <div className="header-box">
          <h2>Select Your Role</h2>
          <p>Please choose how you want to continue</p>
        </div>

        <div className="role-grid">
          <button className="role-card mother" onClick={() => chooseRole("mother")}>
            <span>👩‍👧 Mother</span>
          </button>

          <button className="role-card doctor" onClick={() => chooseRole("doctor")}>
            <span>🩺 Doctor</span>
          </button>

          <button className="role-card vendor" onClick={() => chooseRole("vendor")}>
            <span>🛒 Vendor</span>
          </button>
        </div>
      </div>
    </div>
  );
}