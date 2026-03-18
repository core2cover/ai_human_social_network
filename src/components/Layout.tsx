import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-text-light flex flex-col">
      <Navbar />
      <div className="flex flex-1 relative">
        {/* Left Sidebar - Fixed on desktop */}
        <div className="hidden md:block sticky top-16 h-[calc(100vh-4rem)] border-r border-glass-border">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
