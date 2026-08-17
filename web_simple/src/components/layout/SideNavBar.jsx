import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * DesignStitch SideNavBar component
 * Left navigation sidebar with branding and links
 */
const SideNavBar = ({ isOpen = true, onClose = () => {} }) => {
  const navClasses = `
    fixed left-0 top-0 h-full w-[280px] bg-primary flex flex-col py-6 z-20
    transition-transform duration-300 md:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  const navLinks = [
    { path: '/dashboard', label: 'Documents', icon: 'description', active: true },
    { path: '/sessions', label: 'Sessions', icon: 'history', active: false },
    { path: '/profile', label: 'Profile', icon: 'person', active: false },
  ];

  return (
    <>
      <nav className={navClasses.trim()}>
        {/* Brand / Header */}
        <div className="px-lg mb-xl">
          <div className="text-headline-md font-headline-md font-bold text-on-primary">
            GTPlanner
          </div>
          <div className="text-body-sm font-body-sm text-on-primary-container opacity-70 mt-xs">
            Technical Documentation
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-lg mb-lg">
          <NavLink
            to="/prd/new"
            className="w-full bg-secondary text-on-primary rounded-lg py-sm px-md
                       text-label-caps font-label-caps flex items-center justify-center
                       gap-xs hover:bg-secondary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New PRD
          </NavLink>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col gap-xs px-md">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `
                border-l-4 px-4 py-3 flex items-center gap-md rounded-r-lg group
                ${isActive
                  ? 'border-secondary bg-primary-container text-on-primary-container font-bold scale-95 duration-150'
                  : 'border-transparent text-on-primary-container opacity-70 hover:bg-primary-container hover:opacity-100'
                }
              `}
              end={link.path === '/dashboard'}
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                {link.icon}
              </span>
              <span className="text-label-caps font-label-caps">{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer Links */}
        <div className="mt-auto px-md border-t border-primary-container/30 pt-lg">
          <NavLink
            to="/settings"
            className="text-on-primary-container opacity-70 px-4 py-3 flex items-center
                       gap-md rounded-lg hover:bg-primary-container hover:opacity-100
                       transition-colors border-l-4 border-transparent group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
              account_circle
            </span>
            <span className="text-label-caps font-label-caps">Current User</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-on-background/50 z-10 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default SideNavBar;
