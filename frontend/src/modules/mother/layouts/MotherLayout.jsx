import MotherNavbar from "../components/MotherNavbar";
import MotherSidebar from "../components/MotherSidebar";

export default function MotherLayout({ children }) {
  return (
    <div className="dashboard">
      <aside><MotherSidebar /></aside>

      <div className="main">
        <MotherNavbar />
        <div>{children}</div>
      </div>
    </div>
  );
}