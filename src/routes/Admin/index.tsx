import { Outlet } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";

export default function Admin() {
  return (
    <div className="flex flex-col h-screen">
      <div className="relative z-10 p-3 shadow">
        <div className="container m-auto">
          <AdminNavbar />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
