// Permission system for team member access control

export type AccessLevel = 'full' | 'limited' | 'read_only' | 'custom';

export interface User {
  id: string;
  role: 'admin' | 'team_member';
  accessLevel?: AccessLevel;
  isOriginalAdmin?: boolean;
  customPermissions?: string[];
  restrictions?: string[];
}

// Define what each access level can do
export const ACCESS_LEVEL_PERMISSIONS = {
  full: {
    // Full access - can do everything
    canView: ['*'],
    canEdit: ['*'],
    canDelete: ['*'],
    canCreate: ['*'],
  },
  limited: {
    // Limited access - can view most things, edit some, no deletion of critical items
    canView: ['overview', 'bookings', 'reviews', 'users'],
    canEdit: ['bookings', 'reviews'],
    canDelete: [],
    canCreate: ['bookings'],
  },
  read_only: {
    // Read-only access - can only view, no modifications
    canView: ['overview', 'bookings', 'reviews', 'users', 'timeline'],
    canEdit: [],
    canDelete: [],
    canCreate: [],
  },
  custom: {
    // Custom access - determined by customPermissions array
    canView: [],
    canEdit: [],
    canDelete: [],
    canCreate: [],
  }
};

// Define which tabs should be available for each access level
export const ACCESS_LEVEL_TABS = {
  full: ['overview', 'bookings', 'timeline', 'pricing', 'reviews', 'hero-images', 'users', 'team', 'pms'],
  limited: ['overview', 'bookings', 'timeline', 'reviews', 'users'],
  read_only: ['overview', 'bookings', 'timeline', 'reviews'],
  custom: [] // Determined by customPermissions
};

// Check if user has permission for a specific action
export function hasPermission(
  user: User | null,
  action: 'view' | 'edit' | 'delete' | 'create',
  resource: string
): boolean {
  if (!user) return false;
  
  // Original admins have full access
  if (user.role === 'admin' && user.isOriginalAdmin !== false) {
    return true;
  }
  
  // Team members with full access
  if (user.accessLevel === 'full') {
    return true;
  }
  
  const permissions = ACCESS_LEVEL_PERMISSIONS[user.accessLevel || 'read_only'];
  const allowedResources = permissions[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof permissions] as string[];
  
  return allowedResources.includes('*') || allowedResources.includes(resource);
}

// Get available tabs for user
export function getAvailableTabs(user: User | null): string[] {
  if (!user) return [];
  
  // Original admins have access to all tabs
  if (user.role === 'admin' && user.isOriginalAdmin !== false) {
    return ACCESS_LEVEL_TABS.full;
  }
  
  return ACCESS_LEVEL_TABS[user.accessLevel || 'read_only'];
}

// Check if user can access a specific tab
export function canAccessTab(user: User | null, tab: string): boolean {
  const availableTabs = getAvailableTabs(user);
  return availableTabs.includes(tab);
}

// Get user's display role for UI
export function getUserDisplayRole(user: User | null): string {
  if (!user) return 'Guest';
  
  if (user.role === 'admin' && user.isOriginalAdmin !== false) {
    return 'Administrator';
  }
  
  if (user.role === 'team_member') {
    switch (user.accessLevel) {
      case 'full':
        return 'Manager';
      case 'limited':
        return 'Editor';
      case 'read_only':
        return 'Viewer';
      case 'custom':
        return 'Custom Role';
      default:
        return 'Team Member';
    }
  }
  
  return user.role || 'User';
}

// Get permission level description
export function getAccessLevelDescription(accessLevel: AccessLevel): string {
  switch (accessLevel) {
    case 'full':
      return 'Full access to all features and settings';
    case 'limited':
      return 'Can view and edit most content, limited administrative functions';
    case 'read_only':
      return 'Can only view content, no editing or administrative functions';
    case 'custom':
      return 'Custom permissions based on specific role requirements';
    default:
      return 'No access';
  }
}

// Check if user can perform calendar actions (booking, blocking dates)
export function canPerformCalendarActions(user: User | null): boolean {
  if (!user) return false;
  
  // Original admins have full access
  if (user.role === 'admin' && user.isOriginalAdmin !== false) {
    return true;
  }
  
  // Team members with full access can perform calendar actions
  if (user.role === 'team_member' && user.accessLevel === 'full') {
    return true;
  }
  
  // All other access levels (limited, read_only, custom) cannot perform calendar actions
  return false;
}

// Check if an action should show a permission denied message
export function shouldShowPermissionDenied(user: User | null, action: string, resource: string): boolean {
  if (!user) return true;
  
  // Show permission denied for team members trying to access restricted features
  if (user.role === 'team_member') {
    const accessLevel = user.accessLevel || 'read_only';
    
    // Some examples of restricted actions for team members
    const restrictedActions = {
      'delete': ['users', 'team', 'pricing', 'hero-images'],
      'edit': accessLevel === 'read_only' ? ['*'] : ['team', 'pricing', 'hero-images'],
      'create': accessLevel === 'read_only' ? ['*'] : ['team', 'users']
    };
    
    const restricted = restrictedActions[action as keyof typeof restrictedActions];
    return restricted && (restricted.includes('*') || restricted.includes(resource));
  }
  
  return false;
}
