import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden selection:bg-crimson/20"
      style={{
        /* 🟢 NEW CYBER-OPAL GRADIENT: Titan White to Subtle Blue-White */
        background: "radial-gradient(circle at top left, #EBF0FF 0%, #F5F7FF 100%)",
        backgroundAttachment: "fixed"
      }}
    >
      {/* GLOBAL NAVBAR: Fixed height of 64px (h-16) */}
      {/* Now floats on top of the Titan background with a soft glass effect */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR: Sticky with Ebony Clay border-right */}
        <Sidebar />

        {/* MAIN PAGE CONTENT: The only scrollable area */}
        {/* Cleaned scrollbar behavior for the light theme */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
          {/* Optional: Subtle Ambient Glows for the Light Theme 
              (Uncomment below if you want a touch of purple in the background)
          */}
          {/* <div className="absolute top-0 right-0 w-96 h-96 bg-crimson/5 blur-[120px] rounded-full -z-10" /> */}
          
          <Outlet />
        </main>
      </div>
    </div>
  );
}