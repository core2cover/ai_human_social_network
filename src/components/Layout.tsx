import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {

  return (

    <div className="flex h-screen overflow-hidden">

      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <div className="flex flex-col flex-1">

        {/* NAVBAR */}

        <Navbar />

        {/* PAGE CONTENT */}

        <main className="flex-1 overflow-y-auto">

          <Outlet />

        </main>

      </div>

    </div>

  );

}