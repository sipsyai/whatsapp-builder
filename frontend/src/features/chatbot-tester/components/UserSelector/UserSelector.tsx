/**
 * UserSelector Component
 *
 * Dropdown component for selecting a test user.
 * Displays user phone number and name with search/filter functionality.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TesterUser {
  id: string;
  phoneNumber: string;
  name: string;
  avatar?: string;
}

export interface UserSelectorProps {
  /** Currently selected user ID */
  selectedUserId: string | null;
  /** Callback when a user is selected */
  onSelect: (userId: string, userPhone: string) => void;
  /** Optional list of users (if not provided, will use default/mock data) */
  users?: TesterUser[];
  /** Optional placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// Default/Mock Users (for development)
// ============================================================================

const DEFAULT_USERS: TesterUser[] = [
  { id: 'user-1', phoneNumber: '+905551234567', name: 'Test User 1' },
  { id: 'user-2', phoneNumber: '+905559876543', name: 'Test User 2' },
  { id: 'user-3', phoneNumber: '+905555555555', name: 'Demo User' },
];

// ============================================================================
// Component
// ============================================================================

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onSelect,
  users = DEFAULT_USERS,
  placeholder = 'Select a user...',
  disabled = false,
  className = '',
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ========================================
  // Computed Values
  // ========================================

  /** Get the currently selected user */
  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  /** Filter users based on search query */
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.phoneNumber.includes(query)
    );
  }, [users, searchQuery]);

  // ========================================
  // Event Handlers
  // ========================================

  /** Toggle dropdown open/close */
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  /** Handle user selection */
  const handleSelectUser = useCallback(
    (user: TesterUser) => {
      onSelect(user.id, user.phoneNumber);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onSelect]
  );

  /** Handle search input change */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  /** Handle keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    },
    []
  );

  // ========================================
  // Effects
  // ========================================

  /** Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /** Focus search input when dropdown opens */
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // ========================================
  // Render Helpers
  // ========================================

  /** Render user avatar */
  const renderAvatar = (user: TesterUser, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      );
    }

    // Default avatar with initials
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={`${sizeClasses} rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium`}
      >
        {initials}
      </div>
    );
  };

  /** Render a single user item */
  const renderUserItem = (user: TesterUser, isSelected: boolean) => (
    <button
      key={user.id}
      onClick={() => handleSelectUser(user)}
      className={`
        w-full px-3 py-2 flex items-center gap-3 text-left
        transition-colors duration-150
        ${isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-gray-200 hover:bg-gray-700/50'
        }
      `}
    >
      {renderAvatar(user, 'sm')}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{user.name}</div>
        <div className="text-xs text-gray-400 truncate">{user.phoneNumber}</div>
      </div>
      {isSelected && (
        <span className="material-symbols-outlined text-primary text-lg">
          check
        </span>
      )}
    </button>
  );

  // ========================================
  // Render
  // ========================================

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg border
          flex items-center gap-3
          transition-all duration-200
          ${disabled
            ? 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed opacity-60'
            : 'bg-gray-800 border-gray-700 hover:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/30'
          }
        `}
      >
        {selectedUser ? (
          <>
            {renderAvatar(selectedUser)}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-white truncate">
                {selectedUser.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {selectedUser.phoneNumber}
              </div>
            </div>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400 text-left">
            {placeholder}
          </span>
        )}
        <span
          className={`
            material-symbols-outlined text-gray-400 text-lg
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search users..."
                className="
                  w-full pl-8 pr-3 py-1.5 rounded-md
                  bg-gray-900 border border-gray-700
                  text-sm text-white placeholder-gray-500
                  focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                "
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) =>
                renderUserItem(user, user.id === selectedUserId)
              )
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
