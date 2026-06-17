import DoctorNavbar from "../components/DoctorNavbar";
import DoctorSidebar from "../components/DoctorSidebar";

export default function DoctorLayout({ children }) {
  return (
    <div className="dashboard">
      <aside><DoctorSidebar /></aside>

      <div className="main">
        <DoctorNavbar />
        <div>{children}</div>
      </div>
    </div>
  );
}