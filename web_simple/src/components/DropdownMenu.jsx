/**
 * Dropdown Menu Component
 * Interactive navigation dropdown with context-sensitive options
 */
import React, { useState, useRef, useEffect } from 'react';

function DropdownMenu({ items = [], position = 'bottom', context = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item) => {
    if (item.action) {
      item.action();
    }
    setIsOpen(false);
  };

  // Filter items based on context
  const visibleItems = items.filter(item => {
    if (item.requiresContext && item.requiresContext !== context) {
      return false;
    }
    return true;
  });

  return (
    <div className="dropdown-menu" ref={dropdownRef}>
      {/* Trigger */}
      <button
        className="dropdown-trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="menu-icon">☰</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`dropdown dropdown-${position}`}>
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className={`dropdown-item ${item.submenu ? 'has-submenu' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="item-content">
                {item.icon && <span className="item-icon">{item.icon}</span>}
                <span className="item-label">{item.label}</span>
                {item.badge && <span className="item-badge">{item.badge}</span>}
                {item.submenu && <span className="submenu-arrow">▶</span>}
              </div>

              {/* Submenu items */}
              {item.submenu && isOpen && (
                <div className="dropdown-submenu">
                  {item.submenu.map((subItem, subIndex) => (
                    <div
                      key={subIndex}
                      className="dropdown-item"
                      onClick={() => handleItemClick(subItem)}
                    >
                      <div className="item-content">
                        {subItem.icon && <span className="item-icon">{subItem.icon}</span>}
                        <span className="item-label">{subItem.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;