import React from 'react';

/**
 * DesignStitch TopAppBar component
 * Top header bar with search, JWT status, and user actions
 */
const TopAppBar = ({ onMenuClick = () => {} }) => {
  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-10
                       h-16 flex justify-between items-center px-lg w-full max-w-container-max
                       mx-auto shadow-sm">
      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden text-primary hover:text-secondary transition-colors"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Search Bar */}
      <div className="hidden md:flex items-center bg-surface-container rounded-lg px-md py-xs
                        border border-transparent focus-within:border-secondary
                        transition-colors w-64 max-w-md">
        <span className="material-symbols-outlined text-outline mr-sm text-[20px]">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm
                     w-full p-0 text-primary placeholder:text-outline-variant"
          placeholder="Search..."
          type="text"
        />
      </div>

      <div className="md:hidden font-headline-md text-headline-md font-bold text-primary">
        GTPlanner
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-md">
        <div className="hidden md:flex items-center bg-tertiary-fixed/10 px-sm py-xs
                          rounded-full gap-xs border border-tertiary-fixed-dim/20">
          <span className="material-symbols-outlined text-[16px] text-tertiary">
            vpn_key
          </span>
          <span className="text-label-caps font-label-caps text-tertiary">
            JWT Active
          </span>
        </div>

        <div className="flex items-center gap-sm text-on-surface-variant">
          <button className="hover:text-secondary transition-colors p-xs rounded-full
                              hover:bg-surface-container">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:text-secondary transition-colors p-xs rounded-full
                              hover:bg-surface-container">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
