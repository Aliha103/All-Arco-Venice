import React from 'react';
import { hasPermission, canPerformCalendarActions } from '@/utils/permissions';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionWrapperProps {
  children: React.ReactNode;
  action: 'view' | 'edit' | 'delete' | 'create';
  resource: string;
  fallback?: React.ReactNode;
  showDeniedMessage?: boolean;
  className?: string;
}

export default function PermissionWrapper({
  children,
  action,
  resource,
  fallback = null,
  showDeniedMessage = false,
  className = ""
}: PermissionWrapperProps) {
  const { user } = useAdminAuth();
  
  const hasAccess = hasPermission(user, action, resource);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (showDeniedMessage) {
    return (
      <div className={`flex items-center justify-center p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="text-center">
          <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Access Restricted</p>
          <p className="text-red-500 text-sm">You don't have permission to {action} {resource}</p>
        </div>
      </div>
    );
  }
  
  return <>{fallback}</>;
}

// Specialized wrapper for buttons that become disabled when no permission
interface PermissionButtonProps {
  children: React.ReactNode;
  action: 'edit' | 'delete' | 'create';
  resource: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export function PermissionButton({
  children,
  action,
  resource,
  onClick,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  ...props
}: PermissionButtonProps) {
  const { user } = useAdminAuth();
  
  const hasAccess = hasPermission(user, action, resource);
  const isDisabled = disabled || !hasAccess;
  
  return (
    <Button
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!hasAccess ? `You don't have permission to ${action} ${resource}` : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}

// Component to hide booking actions for read-only users
export function BookingActionsWrapper({ user, children }: { user: any; children: React.ReactNode }) {
  const canPerformActions = canPerformCalendarActions(user);
  
  if (!canPerformActions) {
    return null;
  }
  
  return <>{children}</>;
}

// Component to show access level badge
export function AccessLevelBadge({ user }: { user: any }) {
  if (!user || user.role !== 'team_member') return null;
  
  const accessLevel = user.accessLevel || 'read_only';
  
  const badgeConfig = {
    full: { color: 'bg-green-100 text-green-800', label: 'Full Access' },
    limited: { color: 'bg-yellow-100 text-yellow-800', label: 'Limited Access' },
    read_only: { color: 'bg-red-100 text-red-800', label: 'Read Only' },
    custom: { color: 'bg-purple-100 text-purple-800', label: 'Custom Access' }
  };
  
  const config = badgeConfig[accessLevel as keyof typeof badgeConfig] || badgeConfig.read_only;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Lock className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}
