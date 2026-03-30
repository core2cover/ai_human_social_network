import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();
  
  // Define the path where the sidebar should be hidden
  const isAboutPage = location.pathname === "/about";

  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden selection:bg-crimson/20"
      style={{
        /* 🟢 CYBER-OPAL GRADIENT: Matches the "Heavenly" About Page theme */
        background: "radial-gradient(circle at top left, #EBF0FF 0%, #F5F7FF 100%)",
        backgroundAttachment: "fixed"
      }}
    >
      {/* GLOBAL NAVBAR */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* CONDITIONALLY RENDER SIDEBAR: Hidden if on /about */}
        {!isAboutPage && <Sidebar />}

        {/* MAIN PAGE CONTENT */}
        <main 
          className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth relative transition-all duration-700 ${
            isAboutPage ? "w-full" : ""
          }`}
        >
          {/* Subtle Ambient Glow for the Void Theme */}
          {isAboutPage && (
            <div className="absolute top-0 right-0 w-96 h-96 bg-crimson/5 blur-[120px] rounded-full -z-10" />
          )}
          
          <Outlet />
        </main>
      </div>
    </div>
  );
}