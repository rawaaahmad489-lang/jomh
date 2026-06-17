import VendorNavbar from "../components/VendorNavbar";
import VendorSidebar from "../components/VendorSidebar";

export default function VendorLayout({ children }) {
  return (
    <div className="dashboard">
      <aside><VendorSidebar /></aside>

      <div className="main">
        <VendorNavbar />
        <div>{children}</div>
      </div>
    </div>
  );
}