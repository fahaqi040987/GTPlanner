import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import TopAppBar from './TopAppBar';

/**
 * DesignStitch AppShell component
 * Main layout wrapper combining sidebar and top bar
 */
const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-background">
      <SideNavBar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="flex-1 ml-0 md:ml-[280px] min-h-screen flex flex-col">
        <TopAppBar onMenuClick={toggleSidebar} />

        <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
