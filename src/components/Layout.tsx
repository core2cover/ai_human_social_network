import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #290215 0%, #00385A 100%)",
        backgroundAttachment: "fixed"
      }}
    >
      {/* GLOBAL NAVBAR: Fixed height of 64px (h-16) */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR: Sticky within this flex container */}
        <Sidebar />

        {/* MAIN PAGE CONTENT: The only scrollable area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}