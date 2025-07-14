import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Settings, 
  Eye, 
  Edit3, 
  Trash2, 
  Crown, 
  Activity,
  Clock,
  MapPin,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Key,
  UserCheck,
  UserX,
  Calendar,
  Globe,
  Star,
  Zap,
  TrendingUp,
  Award,
  Target,
  Wifi,
  WifiOff,
  Brain,
  Lock,
  FileText,
  Download,
  RefreshCw,
  Bell,
  Fingerprint,
  Cpu,
  HardDrive,
  Network,
  Layers,
  GitBranch,
  Keyboard,
  Monitor,
  ArrowLeft
} from 'lucide-react';
import '../styles/FuturisticAuth.css';
import '../styles/TeamManagement.css';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    color: string;
    permissions: string[];
  };
  customPermissions: string[];
  restrictions: string[];
  allowedFeatures: string[];
  allowedProperties: string[];
  accessLevel: 'full' | 'limited' | 'read_only' | 'custom';
  isActive: boolean;
  lastAccessAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  riskScore: number;
  deviceInfo: any;
  location: any;
  // Enhanced properties
  loginHistory: Array<{
    timestamp: string;
    ip: string;
    device: string;
    success: boolean;
  }>;
  securityEvents: Array<{
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  performanceMetrics: {
    tasksCompleted: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  biometricData: {
    fingerprintEnabled: boolean;
    faceIdEnabled: boolean;
  };
  aiInsights: {
    productivity: number;
    riskPrediction: number;
    recommendations: string[];
    anomalies: string[];
  };
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  color: string;
  priority: number;
  isActive: boolean;
  // Enhanced properties
  inheritedRoles: string[];
  conditionalPermissions: Array<{
    condition: string;
    permissions: string[];
  }>;
  restrictions: {
    timeBasedAccess: {
      allowedHours: string;
      timezone: string;
    };
    locationBased: {
      allowedIPs: string[];
      geoRestrictions: string[];
    };
    deviceRestrictions: {
      allowedDeviceTypes: string[];
      maxConcurrentSessions: number;
    };
  };
  complianceSettings: {
    requiresMFA: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  // Enhanced properties
  dependencies: string[];
  conflicts: string[];
  auditRequired: boolean;
  temporaryGrant: boolean;
  resourceAccess: string[];
  conditions: Array<{
    type: string;
    value: any;
  }>;
}

interface SecurityAlert {
  id: string;
  type: 'authentication' | 'permission' | 'access' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  memberId?: string;
  resolved: boolean;
  actions: string[];
}

interface AIInsight {
  type: 'productivity' | 'security' | 'compliance' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  data: any;
}

const PERMISSION_CATEGORIES = {
  bookings: 'Booking Management',
  users: 'User Management', 
  properties: 'Property Management',
  financial: 'Financial Operations',
  team: 'Team Management',
  system: 'System Administration',
  analytics: 'Analytics & Reports',
  security: 'Security & Audit',
  compliance: 'Compliance & Legal',
  integrations: 'Third-party Integrations',
  ai: 'AI & Automation',
  monitoring: 'System Monitoring'
};

const PERMISSIONS: Permission[] = [
  // Booking Management
  { key: 'bookings:view', label: 'View Bookings', description: 'View booking information', category: 'bookings', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['bookings'], conditions: [] },
  { key: 'bookings:create', label: 'Create Bookings', description: 'Create new bookings', category: 'bookings', riskLevel: 'medium', dependencies: ['bookings:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['bookings'], conditions: [] },
  { key: 'bookings:edit', label: 'Edit Bookings', description: 'Modify existing bookings', category: 'bookings', riskLevel: 'medium', dependencies: ['bookings:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['bookings'], conditions: [] },
  { key: 'bookings:delete', label: 'Delete Bookings', description: 'Remove bookings', category: 'bookings', riskLevel: 'high', dependencies: ['bookings:view', 'bookings:edit'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['bookings'], conditions: [] },
  { key: 'bookings:cancel', label: 'Cancel Bookings', description: 'Cancel existing bookings', category: 'bookings', riskLevel: 'medium', dependencies: ['bookings:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['bookings'], conditions: [] },
  { key: 'bookings:refund', label: 'Process Refunds', description: 'Process booking refunds', category: 'bookings', riskLevel: 'high', dependencies: ['bookings:view', 'financial:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['bookings', 'payments'], conditions: [] },
  
  // User Management
  { key: 'users:view', label: 'View Users', description: 'View user information', category: 'users', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['users'], conditions: [] },
  { key: 'users:create', label: 'Create Users', description: 'Create new user accounts', category: 'users', riskLevel: 'high', dependencies: ['users:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['users'], conditions: [] },
  { key: 'users:edit', label: 'Edit Users', description: 'Modify user information', category: 'users', riskLevel: 'medium', dependencies: ['users:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['users'], conditions: [] },
  { key: 'users:delete', label: 'Delete Users', description: 'Remove user accounts', category: 'users', riskLevel: 'critical', dependencies: ['users:view', 'users:edit'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['users'], conditions: [] },
  { key: 'users:impersonate', label: 'Impersonate Users', description: 'Login as another user', category: 'users', riskLevel: 'critical', dependencies: ['users:view'], conflicts: [], auditRequired: true, temporaryGrant: true, resourceAccess: ['users', 'sessions'], conditions: [] },
  
  // Financial Operations
  { key: 'financial:view', label: 'View Financial', description: 'View financial data', category: 'financial', riskLevel: 'medium', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['payments', 'revenue'], conditions: [] },
  { key: 'financial:reports', label: 'Financial Reports', description: 'Generate financial reports', category: 'financial', riskLevel: 'medium', dependencies: ['financial:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['payments', 'revenue', 'reports'], conditions: [] },
  { key: 'financial:edit_pricing', label: 'Edit Pricing', description: 'Modify pricing settings', category: 'financial', riskLevel: 'high', dependencies: ['financial:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['pricing'], conditions: [] },
  { key: 'financial:process_payments', label: 'Process Payments', description: 'Handle payment processing', category: 'financial', riskLevel: 'critical', dependencies: ['financial:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['payments'], conditions: [] },
  
  // Team Management
  { key: 'team:view', label: 'View Team', description: 'View team member information', category: 'team', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['team'], conditions: [] },
  { key: 'team:create', label: 'Create Team Members', description: 'Add new team members', category: 'team', riskLevel: 'high', dependencies: ['team:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['team'], conditions: [] },
  { key: 'team:edit', label: 'Edit Team Members', description: 'Modify team member permissions', category: 'team', riskLevel: 'high', dependencies: ['team:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['team'], conditions: [] },
  { key: 'team:delete', label: 'Delete Team Members', description: 'Remove team members', category: 'team', riskLevel: 'critical', dependencies: ['team:view', 'team:edit'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['team'], conditions: [] },
  { key: 'team:manage_roles', label: 'Manage Roles', description: 'Create and edit roles', category: 'team', riskLevel: 'critical', dependencies: ['team:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['roles'], conditions: [] },
  
  // System Administration
  { key: 'system:settings', label: 'System Settings', description: 'Modify system configuration', category: 'system', riskLevel: 'critical', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['system'], conditions: [] },
  { key: 'system:backup', label: 'System Backup', description: 'Create and restore backups', category: 'system', riskLevel: 'high', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['system'], conditions: [] },
  { key: 'system:maintenance', label: 'System Maintenance', description: 'Perform system maintenance', category: 'system', riskLevel: 'high', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['system'], conditions: [] },
  { key: 'system:logs', label: 'System Logs', description: 'Access system logs', category: 'system', riskLevel: 'medium', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['logs'], conditions: [] },
  
  // Security & Audit
  { key: 'security:audit', label: 'Security Audit', description: 'View security logs and audit trails', category: 'security', riskLevel: 'high', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['audit'], conditions: [] },
  { key: 'security:configure', label: 'Security Configuration', description: 'Configure security settings', category: 'security', riskLevel: 'critical', dependencies: [], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['security'], conditions: [] },
  { key: 'security:incident_response', label: 'Incident Response', description: 'Respond to security incidents', category: 'security', riskLevel: 'critical', dependencies: ['security:audit'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['security', 'audit'], conditions: [] },
  
  // Analytics & Reports
  { key: 'analytics:view', label: 'View Analytics', description: 'Access analytics dashboard', category: 'analytics', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['analytics'], conditions: [] },
  { key: 'analytics:export', label: 'Export Analytics', description: 'Export analytics data', category: 'analytics', riskLevel: 'medium', dependencies: ['analytics:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['analytics'], conditions: [] },
  { key: 'analytics:advanced', label: 'Advanced Analytics', description: 'Access advanced analytics features', category: 'analytics', riskLevel: 'medium', dependencies: ['analytics:view'], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['analytics'], conditions: [] },
  
  // AI & Automation
  { key: 'ai:insights', label: 'AI Insights', description: 'Access AI-generated insights', category: 'ai', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['ai'], conditions: [] },
  { key: 'ai:configure', label: 'Configure AI', description: 'Configure AI settings and models', category: 'ai', riskLevel: 'high', dependencies: ['ai:insights'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['ai'], conditions: [] },
  { key: 'ai:automation', label: 'AI Automation', description: 'Set up automated AI workflows', category: 'ai', riskLevel: 'high', dependencies: ['ai:insights'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['ai', 'automation'], conditions: [] },
  
  // Monitoring
  { key: 'monitoring:view', label: 'View Monitoring', description: 'View system monitoring data', category: 'monitoring', riskLevel: 'low', dependencies: [], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['monitoring'], conditions: [] },
  { key: 'monitoring:alerts', label: 'Monitoring Alerts', description: 'Configure monitoring alerts', category: 'monitoring', riskLevel: 'medium', dependencies: ['monitoring:view'], conflicts: [], auditRequired: true, temporaryGrant: false, resourceAccess: ['monitoring'], conditions: [] },
  { key: 'monitoring:real_time', label: 'Real-time Monitoring', description: 'Access real-time monitoring', category: 'monitoring', riskLevel: 'medium', dependencies: ['monitoring:view'], conflicts: [], auditRequired: false, temporaryGrant: false, resourceAccess: ['monitoring'], conditions: [] }
];


// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'ctrl+m': 'show members',
  'ctrl+r': 'show roles',
  'ctrl+p': 'show permissions',
  'ctrl+n': 'create member',
  'ctrl+shift+r': 'create role',
  'f5': 'refresh data',
  'ctrl+a': 'show analytics',
  'ctrl+s': 'security dashboard',
  'ctrl+e': 'export data'
};

const AdvancedTeamManagement: React.FC = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'permissions' | 'analytics' | 'security'>('members');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterAccessLevel, setFilterAccessLevel] = useState('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  
  // Modal states
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  
  // Edit member states
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberData, setEditMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    accessLevel: '',
    isActive: true,
    customPermissions: [] as string[],
    expiresAt: ''
  });
  
  // Step-wise member creation
  const [createMemberStep, setCreateMemberStep] = useState(1);
  const [memberCreationSteps] = useState([
    { id: 1, title: 'Basic Information', description: 'Personal details and contact' },
    { id: 2, title: 'Role & Permissions', description: 'Access level and role assignment' },
    { id: 3, title: 'Security Settings', description: 'MFA, biometrics, and restrictions' },
    { id: 4, title: 'Review & Create', description: 'Verify details and create member' }
  ]);

  // Step-wise role creation
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [createRoleStep, setCreateRoleStep] = useState(1);
  const [roleCreationSteps] = useState([
    { id: 1, title: 'Basic Details', description: 'Role name, description, and color' },
    { id: 2, title: 'Permissions', description: 'Define role permissions and restrictions' },
    { id: 3, title: 'Advanced Settings', description: 'Security and compliance configuration' },
    { id: 4, title: 'Review & Create', description: 'Verify and create the role' }
  ]);

  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as string[],
    priority: 0,
    restrictions: {
      timeBasedAccess: {
        allowedHours: '09:00-17:00',
        timezone: 'UTC'
      },
      locationBased: {
        allowedIPs: [] as string[],
        geoRestrictions: [] as string[]
      },
      deviceRestrictions: {
        allowedDeviceTypes: [] as string[],
        maxConcurrentSessions: 1
      }
    },
    complianceSettings: {
      requiresMFA: false,
      sessionTimeout: 3600,
      passwordPolicy: 'standard' as const,
      auditLevel: 'basic' as 'basic' | 'detailed' | 'comprehensive'
    },
    inheritedRoles: [] as string[],
    conditionalPermissions: [] as Array<{condition: string; permissions: string[]}>,
    isActive: true
  });
  
  // Action states
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<{[key: string]: boolean}>({});
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Enhanced features state
  const realTimeUpdates = true;
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    cpu: 45,
    memory: { usage: 67, available: 33 },
    disk: 32,
    network: 89
  });
  
  // Auto-refresh and real-time updates
  const updateInterval = 30000; // 30 seconds
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  
  
  // Notification system
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  
  // Helper function to safely access arrays
  const safeArray = <T,>(arr: T[] | null | undefined): T[] => Array.isArray(arr) ? arr : [];
  
  // Helper function to check if user is super user
  const isSuperUser = (member: TeamMember): boolean => {
    return member.email === 'admin@allarco.com';
  };
  
  // Form states
  const [newMember, setNewMember] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleId: '',
    accessLevel: 'limited' as 'full' | 'limited' | 'read_only' | 'custom',
    customPermissions: [] as string[],
    restrictions: [] as string[],
    allowedFeatures: [] as string[],
    expiresAt: '',
    requiresMFA: false,
    biometricEnabled: false,
    locationRestrictions: '',
    deviceRestrictions: '',
    timeBasedAccess: ''
  });


  // Refs
  const wsRef = useRef<WebSocket | null>(null);


  // Initialize WebSocket for real-time updates
  useEffect(() => {
    if (realTimeUpdates) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
      };
      
      wsRef.current.onerror = () => {
        setConnectionStatus('disconnected');
      };
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [realTimeUpdates]);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTimeUpdates && connectionStatus === 'connected') {
        fetchTeamMembers();
        fetchSystemHealth();
      }
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateInterval, realTimeUpdates, connectionStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const combo = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');
      
      const action = KEYBOARD_SHORTCUTS[combo as keyof typeof KEYBOARD_SHORTCUTS];
      if (action) {
        event.preventDefault();
        handleShortcutAction(action);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize data
  useEffect(() => {
    fetchTeamMembers();
    fetchRoles();
    fetchSecurityAlerts();
    fetchAIInsights();
    fetchSystemHealth();
  }, []);


  // Handle escape key for Create Role modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateRole) {
        setShowCreateRole(false);
        resetNewRoleForm();
      }
    };

    if (showCreateRole) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCreateRole]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions

  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep only 50 recent notifications
  }, []);


  const handleShortcutAction = useCallback((action: string) => {
    const normalizedAction = action.replace(' ', '_');
    switch (normalizedAction) {
      case 'show_members':
        setActiveTab('members');
        break;
      case 'show_roles':
        setActiveTab('roles');
        break;
      case 'show_permissions':
        setActiveTab('permissions');
        break;
      case 'show_analytics':
        setActiveTab('analytics');
        break;
      case 'show_security':
        setActiveTab('security');
        break;
      case 'create_member':
        setShowCreateMember(true);
        break;
      case 'refresh_data':
        fetchTeamMembers();
        fetchRoles();
        break;
      case 'export_data':
        handleExportData();
        break;
    }
  }, []);

  const handleRealTimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'member_update':
        setTeamMembers(prev => prev.map(member => 
          member.id === data.memberId ? { ...member, ...data.updates } : member
        ));
        break;
      case 'security_alert':
        setSecurityAlerts(prev => [data.alert, ...prev]);
        addNotification({
          type: 'warning',
          title: 'Security Alert',
          message: data.alert.title
        });
        break;
      case 'system_health':
        setSystemHealth(data.health);
        break;
    }
  }, [addNotification]);


  // API functions
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/team/members', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      addNotification({
        type: 'error',
        title: 'Failed to fetch team members',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/team/roles', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      addNotification({
        type: 'error',
        title: 'Failed to fetch roles',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const fetchSecurityAlerts = async () => {
    try {
      const response = await fetch('/api/admin/security/alerts', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityAlerts(data);
      } else {
        console.warn('Failed to fetch security alerts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/admin/ai/insights', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array before setting it
        setAiInsights(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch AI insights:', response.status, response.statusText);
        setAiInsights([]);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      } else {
        console.warn('Failed to fetch system health:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const startEditingMember = (member: TeamMember) => {
    setEditMemberData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      roleId: member.role.id,
      accessLevel: member.accessLevel,
      isActive: member.isActive,
      customPermissions: member.customPermissions || [],
      expiresAt: member.expiresAt || ''
    });
    setIsEditingMember(true);
  };

  const saveEditedMember = async () => {
    if (!selectedMember) return;
    
    try {
      const response = await fetch(`/api/admin/team/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editMemberData)
      });

      if (response.ok) {
        const updatedMember = await response.json();
        setTeamMembers(prev => 
          prev.map(member => 
            member.id === selectedMember.id ? updatedMember : member
          )
        );
        setIsEditingMember(false);
        setShowMemberDetails(false);
        
        // Show success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          title: 'Member Updated',
          message: `${editMemberData.firstName} ${editMemberData.lastName} has been updated successfully`,
          timestamp: new Date(),
          read: false
        }]);
      } else {
        throw new Error('Failed to update member');
      }
    } catch (error) {
      console.error('Failed to update member:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update team member. Please try again.',
        timestamp: new Date(),
        read: false
      }]);
    }
  };

  const cancelEditingMember = () => {
    setIsEditingMember(false);
    setEditMemberData({
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      accessLevel: '',
      isActive: true,
      customPermissions: [],
      expiresAt: ''
    });
  };

  const closeMemberDetailsModal = () => {
    setShowMemberDetails(false);
    setIsEditingMember(false);
    setEditMemberData({
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      accessLevel: '',
      isActive: true,
      customPermissions: [],
      expiresAt: ''
    });
  };

  const handleCreateMember = async () => {
    setIsCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const response = await fetch('/api/admin/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMember)
      });

      if (response.ok) {
        await response.json();
        setCreateSuccess(`Team member ${newMember.firstName} ${newMember.lastName} created successfully!`);
        
        await fetchTeamMembers();
        
        addNotification({
          type: 'success',
          title: 'Team Member Created',
          message: `${newMember.firstName} ${newMember.lastName} has been added to the team`
        });
        
        setTimeout(() => {
          setShowCreateMember(false);
          resetNewMemberForm();
        }, 2000);
      } else {
        const errorData = await response.json();
        setCreateError(errorData.message || 'Failed to create team member');
        addNotification({
          type: 'error',
          title: 'Failed to create team member',
          message: errorData.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Failed to create team member:', error);
      setCreateError('Network error. Please try again.');
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create team member due to network error'
      });
    } finally {
      setIsCreating(false);
    }
  };


  const handleExportData = async () => {
    try {
      const exportData = {
        teamMembers,
        roles,
        permissions: PERMISSIONS,
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin' // Replace with actual user
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-management-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: 'Data Exported',
        message: 'Team management data has been exported successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export team management data'
      });
    }
  };

  const resetNewMemberForm = () => {
    setNewMember({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roleId: '',
      accessLevel: 'limited',
      customPermissions: [],
      restrictions: [],
      allowedFeatures: [],
      expiresAt: '',
      requiresMFA: false,
      biometricEnabled: false,
      locationRestrictions: '',
      deviceRestrictions: '',
      timeBasedAccess: ''
    });
    setCreateSuccess('');
    setCreateError('');
    setCreateMemberStep(1);
  };

  // Step navigation functions
  const nextStep = () => {
    if (createMemberStep < memberCreationSteps.length) {
      setCreateMemberStep(createMemberStep + 1);
    }
  };

  const prevStep = () => {
    if (createMemberStep > 1) {
      setCreateMemberStep(createMemberStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= memberCreationSteps.length) {
      setCreateMemberStep(step);
    }
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(newMember.firstName && newMember.lastName && newMember.email);
      case 2:
        return !!(newMember.roleId && newMember.accessLevel);
      case 3:
        return true; // Security settings are optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const canProceedToNext = validateStep(createMemberStep);

  // Role creation navigation functions
  const nextRoleStep = () => {
    if (createRoleStep < roleCreationSteps.length) {
      setCreateRoleStep(createRoleStep + 1);
    }
  };

  const prevRoleStep = () => {
    if (createRoleStep > 1) {
      setCreateRoleStep(createRoleStep - 1);
    }
  };

  const goToRoleStep = (step: number) => {
    if (step >= 1 && step <= roleCreationSteps.length) {
      setCreateRoleStep(step);
    }
  };

  // Role validation for each step
  const validateRoleStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(newRole.name && newRole.displayName && newRole.description);
      case 2:
        return newRole.permissions.length > 0;
      case 3:
        return true; // Advanced settings are optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const canProceedToNextRole = validateRoleStep(createRoleStep);

  const resetNewRoleForm = () => {
    setNewRole({
      name: '',
      displayName: '',
      description: '',
      color: '#3B82F6',
      permissions: [],
      priority: 0,
      restrictions: {
        timeBasedAccess: {
          allowedHours: '09:00-17:00',
          timezone: 'UTC'
        },
        locationBased: {
          allowedIPs: [],
          geoRestrictions: []
        },
        deviceRestrictions: {
          allowedDeviceTypes: [],
          maxConcurrentSessions: 1
        }
      },
      complianceSettings: {
        requiresMFA: false,
        sessionTimeout: 3600,
        passwordPolicy: 'standard' as const,
        auditLevel: 'basic' as const
      },
      inheritedRoles: [],
      conditionalPermissions: [],
      isActive: true
    });
    setCreateRoleStep(1);
    setCreateError('');
    setCreateSuccess('');
  };

  const handleCreateRole = async () => {
    setIsCreating(true);
    setCreateError('');
    
    try {
      const response = await fetch('/api/admin/team/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        await fetchRoles();
        setCreateSuccess(`Role "${newRole.displayName}" created successfully!`);
        
        addNotification({
          type: 'success',
          title: 'Role Created',
          message: `Role ${newRole.displayName} has been created successfully`
        });
        
        setTimeout(() => {
          setShowCreateRole(false);
          resetNewRoleForm();
        }, 2000);
      } else {
        const errorData = await response.json();
        setCreateError(errorData.message || 'Failed to create role');
        addNotification({
          type: 'error',
          title: 'Failed to create role',
          message: errorData.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Failed to create role:', error);
      setCreateError('Network error. Please try again.');
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create role due to network error'
      });
    } finally {
      setIsCreating(false);
    }
  };


  const toggleMemberStatus = async (memberId: string, isActive: boolean) => {
    setActionLoading(prev => ({ ...prev, [memberId]: true }));
    try {
      await fetch(`/api/admin/team/members/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive })
      });
      await fetchTeamMembers();
      addNotification({
        type: 'success',
        title: 'Member Status Updated',
        message: `Member has been ${!isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Failed to toggle member status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update member status'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const toggleSensitiveInfo = (memberId: string) => {
    setShowSensitiveInfo(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleDropdownToggle = (memberId: string) => {
    setDropdownOpen(prev => prev === memberId ? null : memberId);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
    setDropdownOpen(null);
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    
    if (member && isSuperUser(member)) {
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        title: 'Cannot Delete Super User',
        message: 'Super user admin@allarco.com cannot be deleted.',
        timestamp: new Date(),
        read: false
      }]);
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this team member?')) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [memberId]: true }));
    try {
      await fetch(`/api/admin/team/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await fetchTeamMembers();
      addNotification({
        type: 'success',
        title: 'Member Deleted',
        message: 'Team member has been deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete member:', error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete team member'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: false }));
    }
    setDropdownOpen(null);
  };

  const handleResetPassword = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to reset this member\'s password?')) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [memberId]: true }));
    try {
      const response = await fetch(`/api/admin/team/members/${memberId}/reset-password`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        addNotification({
          type: 'success',
          title: 'Password Reset',
          message: `New password: ${data.newPassword}`
        });
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      addNotification({
        type: 'error',
        title: 'Password Reset Failed',
        message: 'Failed to reset member password'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: false }));
    }
    setDropdownOpen(null);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedMembers.length === 0) {
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'warning',
        title: 'No Members Selected',
        message: 'Please select members to perform bulk action',
        timestamp: new Date(),
        read: false
      }]);
      return;
    }

    // Check if any selected members are super users and action is delete
    if (action === 'delete') {
      const selectedMemberObjects = teamMembers.filter(member => selectedMembers.includes(member.id));
      const hasSuperUser = selectedMemberObjects.some(member => isSuperUser(member));
      
      if (hasSuperUser) {
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          title: 'Cannot Delete Super User',
          message: 'Super user admin@allarco.com cannot be deleted. Please deselect and try again.',
          timestamp: new Date(),
          read: false
        }]);
        return;
      }
    }

    try {
      const response = await fetch('/api/admin/team/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          memberIds: selectedMembers,
          action: action
        })
      });

      if (response.ok) {
        await fetchTeamMembers();
        setSelectedMembers([]);
        addNotification({
          type: 'success',
          title: 'Bulk Action Completed',
          message: `Action ${action} completed for ${selectedMembers.length} members`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Bulk Action Failed',
        message: 'Failed to perform bulk action'
      });
    }
  };

  // Utility functions
  // const getRiskLevelColor = (level: string) => {
  //   switch (level) {
  //     case 'low': return 'text-green-400';
  //     case 'medium': return 'text-yellow-400';
  //     case 'high': return 'text-orange-400';
  //     case 'critical': return 'text-red-400';
  //     default: return 'text-gray-400';
  //   }
  // };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-400';
    if (score <= 50) return 'text-yellow-400';
    if (score <= 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSystemHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Memoized filtered data
  const filteredMembers = useMemo(() => {
    return safeArray(teamMembers).filter(member => {
      const matchesSearch = 
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === 'all' || member.role.id === filterRole;
      const matchesAccessLevel = filterAccessLevel === 'all' || member.accessLevel === filterAccessLevel;
      const matchesRiskLevel = filterRiskLevel === 'all' || (
        filterRiskLevel === 'low' && member.riskScore <= 25 ||
        filterRiskLevel === 'medium' && member.riskScore > 25 && member.riskScore <= 50 ||
        filterRiskLevel === 'high' && member.riskScore > 50 && member.riskScore <= 75 ||
        filterRiskLevel === 'critical' && member.riskScore > 75
      );
      
      return matchesSearch && matchesRole && matchesAccessLevel && matchesRiskLevel;
    });
  }, [teamMembers, searchQuery, filterRole, filterAccessLevel, filterRiskLevel]);

  const activeSecurityAlerts = useMemo(() => {
    return safeArray(securityAlerts).filter(alert => !alert.resolved);
  }, [securityAlerts]);

  const highPriorityInsights = useMemo(() => {
    return safeArray(aiInsights).filter(insight => insight.impact === 'high');
  }, [aiInsights]);

  return (
    <div className="team-management-container">
      
      {/* Header */}
      <div className="team-header">
        <div className="header-left">
          <div className="title-section">
            <h1 className="team-title">
              <Users className="title-icon" />
              Advanced Team Management
              <div className="title-glow"></div>
            </h1>
            <p className="team-subtitle">
              AI-powered team management with real-time insights and security
            </p>
            <div className="team-stats">
              <div className="stat-chip">
                <TrendingUp className="stat-chip-icon" />
                <span>{teamMembers.length} Members</span>
              </div>
              <div className="stat-chip">
                <Shield className="stat-chip-icon" />
                <span>{roles.length} Roles</span>
              </div>
              <div className="stat-chip">
                <Activity className="stat-chip-icon" />
                <span>{safeArray(teamMembers).filter(m => m.isActive).length} Active</span>
              </div>
              <div className="stat-chip">
                {connectionStatus === 'connected' ? (
                  <Wifi className="stat-chip-icon text-green-400" />
                ) : (
                  <WifiOff className="stat-chip-icon text-red-400" />
                )}
                <span>{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {/* System Health Indicators */}
          <div className="system-health">
            <div className="health-item">
              <Cpu className="health-icon" />
              <span className={getSystemHealthColor(systemHealth.cpu)}>
                {systemHealth.cpu}%
              </span>
            </div>
            <div className="health-item">
              <HardDrive className="health-icon" />
              <span className={getSystemHealthColor(typeof systemHealth.memory === 'object' ? (systemHealth.memory as any)?.usage || 0 : systemHealth.memory)}>
                {typeof systemHealth.memory === 'object' ? 
                  `${(systemHealth.memory as any)?.usage || 0}%` : 
                  `${systemHealth.memory}%`
                }
              </span>
            </div>
            <div className="health-item">
              <Network className="health-icon" />
              <span className={getSystemHealthColor(systemHealth.network)}>
                {systemHealth.network}%
              </span>
            </div>
            <div className="health-item">
              <HardDrive className="health-icon" />
              <span className={getSystemHealthColor(typeof systemHealth.disk === 'object' ? (systemHealth.disk as any)?.usage || 0 : systemHealth.disk)}>
                {typeof systemHealth.disk === 'object' ? 
                  `${(systemHealth.disk as any)?.usage || 0}/${(systemHealth.disk as any)?.available || 0}` : 
                  `${systemHealth.disk}%`
                }
              </span>
            </div>
          </div>


          {/* Security Alerts */}
          {activeSecurityAlerts.length > 0 && (
            <div className="security-alerts">
              <button className="alert-btn critical">
                <AlertTriangle className="btn-icon" />
                <span>{activeSecurityAlerts.length}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={() => setShowCreateRole(true)}
            className="futuristic-btn secondary enhanced"
          >
            <Crown className="btn-icon" />
            Create Role
            <div className="btn-glow"></div>
          </button>
          <button
            onClick={() => setShowCreateMember(true)}
            className="futuristic-btn primary enhanced"
          >
            <Plus className="btn-icon" />
            Add Team Member
            <div className="btn-glow"></div>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div className="notifications-bar">
          <div className="notification-items">
            {notifications.filter(n => !n.read).slice(0, 3).map(notification => (
              <div key={notification.id} className={`notification-item ${notification.type}`}>
                <Bell className="notification-icon" />
                <div className="notification-content">
                  <span className="notification-title">{notification.title}</span>
                  <span className="notification-message">{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                  )}
                  className="notification-close"
                >
                  <XCircle className="close-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Tabs */}
      <div className="team-tabs">
        <button
          onClick={() => setActiveTab('members')}
          className={`team-tab ${activeTab === 'members' ? 'active' : ''}`}
        >
          <Users className="tab-icon" />
          Team Members
          <span className="tab-badge">{teamMembers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`team-tab ${activeTab === 'roles' ? 'active' : ''}`}
        >
          <Crown className="tab-icon" />
          Roles
          <span className="tab-badge">{roles.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`team-tab ${activeTab === 'permissions' ? 'active' : ''}`}
        >
          <Shield className="tab-icon" />
          Permissions
          <span className="tab-badge">{PERMISSIONS.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`team-tab ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <Brain className="tab-icon" />
          AI Analytics
          <span className="tab-badge">{highPriorityInsights.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`team-tab ${activeTab === 'security' ? 'active' : ''}`}
        >
          <Lock className="tab-icon" />
          Security
          <span className="tab-badge">{activeSecurityAlerts.length}</span>
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="members-content">
          <div className="filters-bar enhanced">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <Filter className="filter-icon" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.displayName}</option>
                ))}
              </select>
            </div>

            <div className="filter-container">
              <Shield className="filter-icon" />
              <select
                value={filterAccessLevel}
                onChange={(e) => setFilterAccessLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Access Levels</option>
                <option value="full">Full Access</option>
                <option value="limited">Limited Access</option>
                <option value="read_only">Read Only</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="filter-container">
              <AlertTriangle className="filter-icon" />
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk (0-25%)</option>
                <option value="medium">Medium Risk (26-50%)</option>
                <option value="high">High Risk (51-75%)</option>
                <option value="critical">Critical Risk (76-100%)</option>
              </select>
            </div>

            <div className="action-controls">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="futuristic-btn secondary small"
                disabled={selectedMembers.length === 0}
              >
                <Settings className="btn-icon" />
                Bulk Actions ({selectedMembers.length})
              </button>
              <button
                onClick={() => setShowPermissionMatrix(true)}
                className="futuristic-btn tertiary small"
              >
                <Layers className="btn-icon" />
                Permission Matrix
              </button>
              <button
                onClick={handleExportData}
                className="futuristic-btn tertiary small"
              >
                <Download className="btn-icon" />
                Export
              </button>
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedMembers.length > 0 && (
            <div className="bulk-actions-panel">
              <h3>Bulk Actions for {selectedMembers.length} members</h3>
              <div className="bulk-action-buttons">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="futuristic-btn success small"
                >
                  <UserCheck className="btn-icon" />
                  Activate All
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="futuristic-btn warning small"
                >
                  <UserX className="btn-icon" />
                  Deactivate All
                </button>
                <button
                  onClick={() => handleBulkAction('reset_password')}
                  className="futuristic-btn secondary small"
                >
                  <Key className="btn-icon" />
                  Reset Passwords
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="futuristic-btn danger small"
                >
                  <Trash2 className="btn-icon" />
                  Delete All
                </button>
              </div>
            </div>
          )}

          <div className="members-grid enhanced">
            {filteredMembers.map((member, index) => (
              <div key={member.id} className="member-card enhanced" style={{animationDelay: `${index * 0.1}s`} as React.CSSProperties}>
                <div className="card-glow"></div>
                
                {/* Selection checkbox */}
                <div className="member-selection">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(prev => [...prev, member.id]);
                      } else {
                        setSelectedMembers(prev => prev.filter(id => id !== member.id));
                      }
                    }}
                    className="selection-checkbox"
                  />
                </div>

                <div className="member-header">
                  <div className="member-avatar enhanced">
                    <span className="avatar-text">
                      {member.firstName[0]}{member.lastName[0]}
                    </span>
                    <div className="avatar-status">
                      {member.isActive ? (
                        <div className="status-dot active"></div>
                      ) : (
                        <div className="status-dot inactive"></div>
                      )}
                    </div>
                    {member.biometricData?.fingerprintEnabled && (
                      <div className="biometric-indicator">
                        <Fingerprint className="biometric-icon" />
                      </div>
                    )}
                  </div>
                  
                  <div className="member-info">
                    <h3 className="member-name">
                      {member.firstName} {member.lastName}
                      {member.riskScore > 75 && <AlertTriangle className="risk-warning" />}
                      {member.aiInsights?.anomalies.length > 0 && <Brain className="ai-warning" />}
                    </h3>
                    <p className="member-email">
                      {showSensitiveInfo[member.id] ? member.email : member.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
                    </p>
                    <div className="member-badges">
                      <span className="role-badge" style={{ backgroundColor: member.role.color + '20', color: member.role.color }}>
                        {member.role.displayName}
                      </span>
                      <span className="access-level">{member.accessLevel}</span>
                      {member.expiresAt && (
                        <span className="expiry-badge">
                          <Clock className="badge-icon" />
                          Expires {new Date(member.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="member-actions">
                    <button
                      onClick={() => toggleSensitiveInfo(member.id)}
                      className="action-btn secondary"
                      title={showSensitiveInfo[member.id] ? 'Hide Details' : 'Show Details'}
                    >
                      {showSensitiveInfo[member.id] ? <Eye className="action-icon" /> : <Eye className="action-icon opacity-50" />}
                    </button>
                    <button
                      onClick={() => toggleMemberStatus(member.id, member.isActive)}
                      className={`action-btn ${member.isActive ? 'danger' : 'success'}`}
                      title={member.isActive ? 'Deactivate' : 'Activate'}
                      disabled={actionLoading[member.id]}
                    >
                      {actionLoading[member.id] ? (
                        <div className="loading-spinner small"></div>
                      ) : member.isActive ? (
                        <UserX className="action-icon" />
                      ) : (
                        <UserCheck className="action-icon" />
                      )}
                    </button>
                    <div className="dropdown-container">
                      <button 
                        onClick={() => handleDropdownToggle(member.id)}
                        className="action-btn secondary" 
                        title="More Options"
                      >
                        <MoreVertical className="action-icon" />
                      </button>
                      {dropdownOpen === member.id && (
                        <div className="dropdown-menu enhanced">
                          <button 
                            onClick={() => handleEditMember(member)}
                            className="dropdown-item"
                          >
                            <Edit3 className="dropdown-icon" />
                            Edit Member
                          </button>
                          <button 
                            onClick={() => handleResetPassword(member.id)}
                            className="dropdown-item"
                          >
                            <Key className="dropdown-icon" />
                            Reset Password
                          </button>
                          <button className="dropdown-item">
                            <FileText className="dropdown-icon" />
                            View Audit Log
                          </button>
                          <button className="dropdown-item">
                            <Brain className="dropdown-icon" />
                            AI Insights
                          </button>
                          {isSuperUser(member) ? (
                            <div className="dropdown-item disabled" title="Super user cannot be deleted">
                              <Trash2 className="dropdown-icon" />
                              Delete Member (Protected)
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDeleteMember(member.id)}
                              className="dropdown-item danger"
                            >
                              <Trash2 className="dropdown-icon" />
                              Delete Member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {showSensitiveInfo[member.id] && (
                  <div className="member-details enhanced">
                    <div className="member-stats">
                      <div className="stat-item">
                        <Activity className="stat-icon" />
                        <span className="stat-label">Risk Score:</span>
                        <span className={`stat-value ${getRiskScoreColor(member.riskScore)}`}>
                          {member.riskScore}%
                        </span>
                      </div>
                      
                      <div className="stat-item">
                        <Clock className="stat-icon" />
                        <span className="stat-label">Last Access:</span>
                        <span className="stat-value">
                          {member.lastAccessAt 
                            ? new Date(member.lastAccessAt).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                      
                      <div className="stat-item">
                        <Key className="stat-icon" />
                        <span className="stat-label">Permissions:</span>
                        <span className="stat-value">
                          {member.role.permissions.length + member.customPermissions.length}
                        </span>
                      </div>

                      <div className="stat-item">
                        <Brain className="stat-icon" />
                        <span className="stat-label">AI Productivity:</span>
                        <span className="stat-value">
                          {member.aiInsights?.productivity || 0}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="performance-metrics">
                      <div className="metric-item">
                        <Target className="metric-icon" />
                        <span>Tasks: {member.performanceMetrics?.tasksCompleted || 0}</span>
                      </div>
                      <div className="metric-item">
                        <Clock className="metric-icon" />
                        <span>Avg Time: {member.performanceMetrics?.averageResponseTime || 0}ms</span>
                      </div>
                      <div className="metric-item">
                        <AlertTriangle className="metric-icon" />
                        <span>Error Rate: {member.performanceMetrics?.errorRate || 0}%</span>
                      </div>
                    </div>

                    {/* Security Events */}
                    {member.securityEvents && member.securityEvents.length > 0 && (
                      <div className="security-events">
                        <h4>Recent Security Events</h4>
                        {member.securityEvents.slice(0, 3).map((event, idx) => (
                          <div key={idx} className={`security-event ${event.severity}`}>
                            <span className="event-type">{event.type}</span>
                            <span className="event-description">{event.description}</span>
                            <span className="event-time">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Recommendations */}
                    {member.aiInsights?.recommendations && member.aiInsights.recommendations.length > 0 && (
                      <div className="ai-recommendations">
                        <h4>AI Recommendations</h4>
                        {member.aiInsights.recommendations.slice(0, 2).map((rec, idx) => (
                          <div key={idx} className="ai-recommendation">
                            <Brain className="ai-icon" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="roles-content">
          <div className="roles-grid enhanced">
            {roles.map((role, index) => (
              <div key={role.id} className="role-card advanced" style={{animationDelay: `${index * 0.1}s`} as React.CSSProperties}>
                <div className="card-glow"></div>
                <div className="role-header">
                  <div className="role-icon-container">
                    <div 
                      className="role-color-indicator"
                      style={{ backgroundColor: role.color }}
                    />
                    <Crown className="role-icon" style={{ color: role.color }} />
                  </div>
                  <div className="role-title-section">
                    <h3 className="role-name">{role.displayName}</h3>
                    <div className="role-meta">
                      <span className="role-priority">
                        <Star className="priority-icon" />
                        Priority: {role.priority}
                      </span>
                      <span className={`role-status ${role.isActive ? 'active' : 'inactive'}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="role-description">{role.description}</p>
                
                {/* Enhanced role information */}
                <div className="role-advanced-info">
                  {role.inheritedRoles && role.inheritedRoles.length > 0 && (
                    <div className="inherited-roles">
                      <h4>Inherits From</h4>
                      <div className="inherited-tags">
                        {role.inheritedRoles.map(inheritedId => {
                          const inheritedRole = roles.find(r => r.id === inheritedId);
                          return (
                            <span key={inheritedId} className="inherited-tag">
                              {inheritedRole?.displayName || inheritedId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="role-restrictions">
                    <h4>Access Restrictions</h4>
                    <div className="restriction-items">
                      {role.complianceSettings?.requiresMFA && (
                        <span className="restriction-tag">
                          <Shield className="restriction-icon" />
                          MFA Required
                        </span>
                      )}
                      {role.restrictions?.timeBasedAccess?.allowedHours && (
                        <span className="restriction-tag">
                          <Clock className="restriction-icon" />
                          {role.restrictions.timeBasedAccess.allowedHours}
                        </span>
                      )}
                      {role.restrictions?.deviceRestrictions?.maxConcurrentSessions && (
                        <span className="restriction-tag">
                          <Monitor className="restriction-icon" />
                          Max {role.restrictions.deviceRestrictions.maxConcurrentSessions} sessions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="role-permissions">
                  <h4 className="permissions-title">
                    <Shield className="permissions-icon" />
                    Permissions ({role.permissions.length})
                  </h4>
                  <div className="permissions-tags">
                    {role.permissions.slice(0, 4).map(permission => {
                      const perm = PERMISSIONS.find(p => p.key === permission);
                      return (
                        <span key={permission} className={`permission-tag ${perm?.riskLevel || 'low'}`}>
                          {perm?.label || permission}
                        </span>
                      );
                    })}
                    {role.permissions.length > 4 && (
                      <span className="permission-tag more">
                        +{role.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="role-stats">
                  <div className="role-stat">
                    <Users className="stat-icon" />
                    <span className="stat-label">Members</span>
                    <span className="stat-value">
                      {teamMembers.filter(m => m.role.id === role.id).length}
                    </span>
                  </div>
                  <div className="role-stat">
                    <Activity className="stat-icon" />
                    <span className="stat-label">Avg Risk</span>
                    <span className="stat-value">
                      {Math.round(
                        teamMembers
                          .filter(m => m.role.id === role.id)
                          .reduce((sum, m) => sum + m.riskScore, 0) / 
                        (teamMembers.filter(m => m.role.id === role.id).length || 1)
                      )}%
                    </span>
                  </div>
                  <div className="role-stat">
                    <Lock className="stat-icon" />
                    <span className="stat-label">Security</span>
                    <span className="stat-value">
                      {role.complianceSettings?.auditLevel || 'Basic'}
                    </span>
                  </div>
                </div>
                
                <div className="role-actions">
                  <button className="futuristic-btn secondary small enhanced">
                    <Edit3 className="btn-icon" />
                    Edit
                    <div className="btn-glow"></div>
                  </button>
                  <button className="futuristic-btn tertiary small">
                    <Eye className="btn-icon" />
                    View
                  </button>
                  <button className="futuristic-btn tertiary small">
                    <GitBranch className="btn-icon" />
                    Clone
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="permissions-content enhanced">
          <div className="permissions-header">
            <div className="permissions-search">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search permissions..."
                className="search-input"
              />
            </div>
            <div className="permissions-filters">
              <select className="filter-select">
                <option value="all">All Categories</option>
                {Object.entries(PERMISSION_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select className="filter-select">
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          {Object.entries(PERMISSION_CATEGORIES).map(([category, label]) => (
            <div key={category} className="permission-category enhanced">
              <h3 className="category-title">
                <Shield className="category-icon" />
                {label}
                <span className="category-count">
                  {PERMISSIONS.filter(p => p.category === category).length} permissions
                </span>
              </h3>
              <div className="permissions-grid enhanced">
                {PERMISSIONS.filter(p => p.category === category).map(permission => (
                  <div key={permission.key} className="permission-card enhanced">
                    <div className="permission-header">
                      <h4 className="permission-label">{permission.label}</h4>
                      <span className={`risk-badge ${permission.riskLevel}`}>
                        {permission.riskLevel}
                      </span>
                    </div>
                    <p className="permission-description">{permission.description}</p>
                    
                    {/* Enhanced permission details */}
                    <div className="permission-details">
                      {permission.dependencies.length > 0 && (
                        <div className="permission-dependencies">
                          <span className="detail-label">Dependencies:</span>
                          <div className="dependency-tags">
                            {permission.dependencies.map(dep => (
                              <span key={dep} className="dependency-tag">{dep}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {permission.auditRequired && (
                        <div className="audit-required">
                          <FileText className="audit-icon" />
                          <span>Audit Required</span>
                        </div>
                      )}
                      
                      {permission.temporaryGrant && (
                        <div className="temporary-grant">
                          <Clock className="temp-icon" />
                          <span>Temporary Grant Allowed</span>
                        </div>
                      )}
                    </div>
                    
                    <code className="permission-key">{permission.key}</code>
                    
                    <div className="permission-usage">
                      <span className="usage-label">Used by:</span>
                      <span className="usage-count">
                        {roles.filter(role => role.permissions.includes(permission.key)).length} roles
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <div className="analytics-header">
            <h2>AI-Powered Analytics & Insights</h2>
            <div className="analytics-controls">
              <button className="futuristic-btn secondary small">
                <RefreshCw className="btn-icon" />
                Refresh Insights
              </button>
              <button className="futuristic-btn tertiary small">
                <Download className="btn-icon" />
                Export Report
              </button>
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-card productivity">
              <div className="insight-header">
                <Brain className="insight-icon" />
                <h3>Team Productivity Analysis</h3>
              </div>
              <div className="insight-content">
                <div className="productivity-metrics">
                  <div className="metric">
                    <span className="metric-value">87%</span>
                    <span className="metric-label">Overall Productivity</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">12.3h</span>
                    <span className="metric-label">Avg Response Time</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">94%</span>
                    <span className="metric-label">Task Completion</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="insight-card security">
              <div className="insight-header">
                <Lock className="insight-icon" />
                <h3>Security Risk Assessment</h3>
              </div>
              <div className="insight-content">
                <div className="risk-distribution">
                  <div className="risk-item low">
                    <span className="risk-count">{teamMembers.filter(m => m.riskScore <= 25).length}</span>
                    <span className="risk-label">Low Risk</span>
                  </div>
                  <div className="risk-item medium">
                    <span className="risk-count">{teamMembers.filter(m => m.riskScore > 25 && m.riskScore <= 50).length}</span>
                    <span className="risk-label">Medium Risk</span>
                  </div>
                  <div className="risk-item high">
                    <span className="risk-count">{teamMembers.filter(m => m.riskScore > 50 && m.riskScore <= 75).length}</span>
                    <span className="risk-label">High Risk</span>
                  </div>
                  <div className="risk-item critical">
                    <span className="risk-count">{teamMembers.filter(m => m.riskScore > 75).length}</span>
                    <span className="risk-label">Critical Risk</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="insight-card permissions">
              <div className="insight-header">
                <Shield className="insight-icon" />
                <h3>Permission Usage Analysis</h3>
              </div>
              <div className="insight-content">
                <div className="permission-stats">
                  <div className="stat">
                    <span className="stat-value">{PERMISSIONS.filter(p => p.riskLevel === 'critical').length}</span>
                    <span className="stat-label">Critical Permissions</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {teamMembers.reduce((sum, m) => sum + m.role.permissions.length + m.customPermissions.length, 0)}
                    </span>
                    <span className="stat-label">Total Grants</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-insights-section">
            <h3>AI Recommendations</h3>
            <div className="insights-list">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  <div className="insight-meta">
                    <Brain className="insight-type-icon" />
                    <span className="insight-type">{insight.type}</span>
                    <span className={`insight-impact ${insight.impact}`}>{insight.impact} impact</span>
                    <span className="insight-confidence">{insight.confidence}% confidence</span>
                  </div>
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                  {insight.recommendations.length > 0 && (
                    <div className="recommendations">
                      <h5>Recommendations:</h5>
                      <ul>
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="security-content">
          <div className="security-header">
            <h2>Security Dashboard</h2>
            <div className="security-controls">
              <button className="futuristic-btn danger small">
                <AlertTriangle className="btn-icon" />
                Security Scan
              </button>
              <button className="futuristic-btn secondary small">
                <FileText className="btn-icon" />
                Audit Report
              </button>
            </div>
          </div>

          <div className="security-overview">
            <div className="security-metric">
              <Lock className="metric-icon" />
              <span className="metric-value">{teamMembers.filter(m => m.biometricData?.fingerprintEnabled).length}</span>
              <span className="metric-label">Biometric Enabled</span>
            </div>
            <div className="security-metric">
              <Shield className="metric-icon" />
              <span className="metric-value">{activeSecurityAlerts.length}</span>
              <span className="metric-label">Active Alerts</span>
            </div>
            <div className="security-metric">
              <Activity className="metric-icon" />
              <span className="metric-value">
                {Math.round(teamMembers.reduce((sum, m) => sum + m.riskScore, 0) / teamMembers.length)}%
              </span>
              <span className="metric-label">Avg Risk Score</span>
            </div>
          </div>

          <div className="security-alerts-section">
            <h3>Security Alerts</h3>
            <div className="alerts-list">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.severity} ${alert.resolved ? 'resolved' : ''}`}>
                  <div className="alert-header">
                    <AlertTriangle className={`alert-icon ${alert.severity}`} />
                    <h4>{alert.title}</h4>
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p>{alert.description}</p>
                  {!alert.resolved && (
                    <div className="alert-actions">
                      {alert.actions.map((action, idx) => (
                        <button key={idx} className="futuristic-btn small secondary">
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step-wise Create Member Modal */}
      {showCreateMember && (
        <div className="modal-overlay enhanced">
          <div className="modal-content large step-wizard">
            <div className="modal-header">
              <h2 className="modal-title">
                <UserCheck className="modal-icon" />
                Create Team Member - Step {createMemberStep} of {memberCreationSteps.length}
              </h2>
              <p className="modal-subtitle">{memberCreationSteps[createMemberStep - 1]?.description}</p>
              
              {/* Step Progress Indicator */}
              <div className="step-progress">
                {memberCreationSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`step-indicator ${createMemberStep === step.id ? 'active' : ''} ${createMemberStep > step.id ? 'completed' : ''}`}
                    onClick={() => goToStep(step.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="step-number">
                      {createMemberStep > step.id ? <CheckCircle className="step-icon" /> : step.id}
                    </div>
                    <div className="step-info">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {createSuccess && (
                <div className="success-message enhanced">
                  <CheckCircle className="message-icon" />
                  {createSuccess}
                </div>
              )}
              
              {createError && (
                <div className="error-message enhanced">
                  <XCircle className="message-icon" />
                  {createError}
                </div>
              )}
            </div>
            
            {/* Step Content */}
            <div className="step-content">
              {createMemberStep === 1 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Users className="step-icon" />
                    Basic Information
                  </h3>
                  <p className="step-description">Enter the team member's personal details and contact information.</p>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <Users className="label-icon" />
                        First Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter first name"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        <Users className="label-icon" />
                        Last Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter last name"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Globe className="label-icon" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Enter email address"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Key className="label-icon" />
                      Password *
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Create a secure password"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <span className="form-hint">Minimum 6 characters required</span>
                  </div>
                </div>
              )}

              {createMemberStep === 2 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Crown className="step-icon" />
                    Role & Permissions
                  </h3>
                  <p className="step-description">Assign a role and configure access permissions for the team member.</p>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Crown className="label-icon" />
                      Role Assignment *
                    </label>
                    <select
                      className="form-select"
                      value={newMember.roleId}
                      onChange={(e) => setNewMember({ ...newMember, roleId: e.target.value })}
                      required
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.displayName} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Shield className="label-icon" />
                      Access Level *
                    </label>
                    <div className="access-level-options enhanced">
                      {[
                        { value: 'limited', label: 'Limited Access', description: 'Basic permissions with role restrictions' },
                        { value: 'full', label: 'Full Access', description: 'Complete access to all role permissions' },
                        { value: 'read_only', label: 'Read Only', description: 'View-only access, no modifications allowed' },
                        { value: 'custom', label: 'Custom', description: 'Define specific permissions manually' }
                      ].map(level => (
                        <label key={level.value} className="radio-option enhanced">
                          <input
                            type="radio"
                            name="accessLevel"
                            value={level.value}
                            checked={newMember.accessLevel === level.value}
                            onChange={(e) => setNewMember({ ...newMember, accessLevel: e.target.value as 'full' | 'limited' | 'read_only' | 'custom' })}
                          />
                          <div className="radio-content">
                            <span className="radio-label">{level.label}</span>
                            <span className="radio-description">{level.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Permissions Section */}
                  {(newMember.accessLevel as string) === 'custom' && (
                    <div className="form-group">
                      <label className="form-label">
                        <Settings className="label-icon" />
                        Custom Permissions
                      </label>
                      <div className="permissions-grid enhanced">
                        {Object.entries(PERMISSION_CATEGORIES).map(([category, label]) => (
                          <div key={category} className="permission-category-section">
                            <h4 className="category-label">{label}</h4>
                            <div className="permission-checkboxes">
                              {PERMISSIONS.filter(p => p.category === category).slice(0, 3).map(permission => (
                                <label key={permission.key} className="checkbox-option enhanced">
                                  <input
                                    type="checkbox"
                                    checked={newMember.customPermissions.includes(permission.key)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewMember({
                                          ...newMember,
                                          customPermissions: [...newMember.customPermissions, permission.key]
                                        });
                                      } else {
                                        setNewMember({
                                          ...newMember,
                                          customPermissions: newMember.customPermissions.filter(p => p !== permission.key)
                                        });
                                      }
                                    }}
                                  />
                                  <span className="checkbox-label">
                                    {permission.label}
                                    <span className={`risk-indicator ${permission.riskLevel}`}>
                                      {permission.riskLevel}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {createMemberStep === 3 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Shield className="step-icon" />
                    Security Settings
                  </h3>
                  <p className="step-description">Configure advanced security options and access restrictions.</p>
                  
                  <div className="security-options">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={newMember.requiresMFA}
                        onChange={(e) => setNewMember({ ...newMember, requiresMFA: e.target.checked })}
                      />
                      <span className="checkbox-label">
                        <Shield className="option-icon" />
                        Require Multi-Factor Authentication
                      </span>
                    </label>
                    
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={newMember.biometricEnabled}
                        onChange={(e) => setNewMember({ ...newMember, biometricEnabled: e.target.checked })}
                      />
                      <span className="checkbox-label">
                        <Fingerprint className="option-icon" />
                        Enable Biometric Authentication
                      </span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <MapPin className="label-icon" />
                      Location Restrictions (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter allowed IP addresses or regions"
                      value={newMember.locationRestrictions}
                      onChange={(e) => setNewMember({ ...newMember, locationRestrictions: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Monitor className="label-icon" />
                      Device Restrictions (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter allowed device types"
                      value={newMember.deviceRestrictions}
                      onChange={(e) => setNewMember({ ...newMember, deviceRestrictions: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Clock className="label-icon" />
                      Time-based Access (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 09:00-17:00 UTC"
                      value={newMember.timeBasedAccess}
                      onChange={(e) => setNewMember({ ...newMember, timeBasedAccess: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar className="label-icon" />
                      Access Expiry (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={newMember.expiresAt}
                      onChange={(e) => setNewMember({ ...newMember, expiresAt: e.target.value })}
                    />
                    <span className="form-hint">Leave empty for permanent access</span>
                  </div>
                </div>
              )}

              {createMemberStep === 4 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <CheckCircle className="step-icon" />
                    Review & Create
                  </h3>
                  <p className="step-description">Review all details before creating the team member.</p>
                  
                  <div className="member-review">
                    <div className="review-section">
                      <h4>Basic Information</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <span className="review-label">Name:</span>
                          <span className="review-value">{newMember.firstName} {newMember.lastName}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Email:</span>
                          <span className="review-value">{newMember.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Role & Permissions</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <span className="review-label">Role:</span>
                          <span className="review-value">
                            {roles.find(r => r.id === newMember.roleId)?.displayName || 'Not selected'}
                          </span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Access Level:</span>
                          <span className="review-value">{newMember.accessLevel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Security Settings</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <span className="review-label">MFA Required:</span>
                          <span className="review-value">{newMember.requiresMFA ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Biometric Auth:</span>
                          <span className="review-value">{newMember.biometricEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions step-actions">
              <button 
                onClick={() => setShowCreateMember(false)} 
                className="futuristic-btn secondary enhanced"
                type="button"
              >
                <XCircle className="btn-icon" />
                Cancel
                <div className="btn-glow"></div>
              </button>

              <div className="step-navigation">
                {createMemberStep > 1 && (
                  <button 
                    onClick={prevStep}
                    className="futuristic-btn secondary enhanced"
                    type="button"
                  >
                    <ArrowLeft className="btn-icon" />
                    Previous
                    <div className="btn-glow"></div>
                  </button>
                )}

                {createMemberStep < memberCreationSteps.length ? (
                  <button 
                    onClick={nextStep}
                    className="futuristic-btn primary enhanced"
                    type="button"
                    disabled={!canProceedToNext}
                  >
                    Next
                    <ArrowLeft className="btn-icon" style={{ transform: 'rotate(180deg)' }} />
                    <div className="btn-glow"></div>
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateMember} 
                    className="futuristic-btn primary enhanced"
                    type="button"
                    disabled={!canProceedToNext || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="loading-spinner"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="btn-icon" />
                        Create Member
                      </>
                    )}
                    <div className="btn-glow"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-wise Create Role Modal */}
      {showCreateRole && (
        <div 
          className="modal-overlay enhanced"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateRole(false);
              resetNewRoleForm();
            }
          }}
        >
          <div className="modal-content large step-wizard">
            <div className="modal-header">
              <h2 className="modal-title">
                <Crown className="modal-icon" />
                Create Role - Step {createRoleStep} of {roleCreationSteps.length}
              </h2>
              <p className="modal-subtitle">{roleCreationSteps[createRoleStep - 1]?.description}</p>
              
              {/* Step Progress Indicator */}
              <div className="step-progress">
                {roleCreationSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`step-indicator ${createRoleStep === step.id ? 'active' : ''} ${createRoleStep > step.id ? 'completed' : ''}`}
                    onClick={() => goToRoleStep(step.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="step-number">
                      {createRoleStep > step.id ? <CheckCircle className="step-icon" /> : step.id}
                    </div>
                    <div className="step-info">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {createSuccess && (
                <div className="success-message enhanced">
                  <CheckCircle className="message-icon" />
                  {createSuccess}
                </div>
              )}
              
              {createError && (
                <div className="error-message enhanced">
                  <XCircle className="message-icon" />
                  {createError}
                </div>
              )}
            </div>
            
            {/* Step Content */}
            <div className="step-content">
              {createRoleStep === 1 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Crown className="step-icon" />
                    Basic Details
                  </h3>
                  <p className="step-description">Define the role's basic information and visual appearance.</p>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Crown className="label-icon" />
                      Role Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., admin, manager, viewer"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                      required
                    />
                    <span className="form-hint">Internal role identifier (lowercase, underscore allowed)</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <UserCheck className="label-icon" />
                      Display Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., System Administrator, Team Manager"
                      value={newRole.displayName}
                      onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                      required
                    />
                    <span className="form-hint">Human-readable role name</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <FileText className="label-icon" />
                      Description *
                    </label>
                    <textarea
                      className="form-input"
                      placeholder="Describe the role's purpose and responsibilities..."
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <Star className="label-icon" />
                        Role Color
                      </label>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          className="form-color-input"
                          value={newRole.color}
                          onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={newRole.color}
                          onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        <TrendingUp className="label-icon" />
                        Priority Level
                      </label>
                      <select
                        className="form-select"
                        value={newRole.priority}
                        onChange={(e) => setNewRole({ ...newRole, priority: parseInt(e.target.value) })}
                      >
                        <option value={0}>Low (0)</option>
                        <option value={1}>Normal (1)</option>
                        <option value={2}>High (2)</option>
                        <option value={3}>Critical (3)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {createRoleStep === 2 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Shield className="step-icon" />
                    Permissions
                  </h3>
                  <p className="step-description">Select the permissions this role will have access to.</p>
                  
                  <div className="permissions-grid enhanced">
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, label]) => (
                      <div key={category} className="permission-category-section">
                        <div className="category-header">
                          <h4 className="category-label">{label}</h4>
                          <button
                            type="button"
                            className="select-all-btn"
                            onClick={() => {
                              const categoryPermissions = PERMISSIONS.filter(p => p.category === category).map(p => p.key);
                              const hasAll = categoryPermissions.every(p => newRole.permissions.includes(p));
                              
                              if (hasAll) {
                                setNewRole({
                                  ...newRole,
                                  permissions: newRole.permissions.filter(p => !categoryPermissions.includes(p))
                                });
                              } else {
                                setNewRole({
                                  ...newRole,
                                  permissions: Array.from(new Set([...newRole.permissions, ...categoryPermissions]))
                                });
                              }
                            }}
                          >
                            {PERMISSIONS.filter(p => p.category === category).every(p => newRole.permissions.includes(p.key)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="permission-checkboxes">
                          {PERMISSIONS.filter(p => p.category === category).map(permission => (
                            <label key={permission.key} className="checkbox-option enhanced">
                              <input
                                type="checkbox"
                                checked={newRole.permissions.includes(permission.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRole({
                                      ...newRole,
                                      permissions: [...newRole.permissions, permission.key]
                                    });
                                  } else {
                                    setNewRole({
                                      ...newRole,
                                      permissions: newRole.permissions.filter(p => p !== permission.key)
                                    });
                                  }
                                }}
                              />
                              <span className="checkbox-label">
                                <span className="permission-name">{permission.label}</span>
                                <span className={`risk-indicator ${permission.riskLevel}`}>
                                  {permission.riskLevel}
                                </span>
                              </span>
                              <p className="permission-description">{permission.description}</p>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {createRoleStep === 3 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <Lock className="step-icon" />
                    Advanced Settings
                  </h3>
                  <p className="step-description">Configure security and compliance settings for this role.</p>
                  
                  <div className="form-section">
                    <h4>Security Requirements</h4>
                    <div className="security-options">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={newRole.complianceSettings.requiresMFA}
                          onChange={(e) => setNewRole({
                            ...newRole,
                            complianceSettings: {
                              ...newRole.complianceSettings,
                              requiresMFA: e.target.checked
                            }
                          })}
                        />
                        <span className="checkbox-label">
                          <Shield className="option-icon" />
                          Require Multi-Factor Authentication
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <Clock className="label-icon" />
                        Session Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={newRole.complianceSettings.sessionTimeout}
                        onChange={(e) => setNewRole({
                          ...newRole,
                          complianceSettings: {
                            ...newRole.complianceSettings,
                            sessionTimeout: parseInt(e.target.value) || 3600
                          }
                        })}
                        min={300}
                        max={86400}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        <Activity className="label-icon" />
                        Audit Level
                      </label>
                      <select
                        className="form-select"
                        value={newRole.complianceSettings.auditLevel}
                        onChange={(e) => setNewRole({
                          ...newRole,
                          complianceSettings: {
                            ...newRole.complianceSettings,
                            auditLevel: e.target.value as 'basic' | 'detailed' | 'comprehensive'
                          }
                        })}
                      >
                        <option value="basic">Basic</option>
                        <option value="detailed">Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Clock className="label-icon" />
                      Time-based Access (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 09:00-17:00"
                      value={newRole.restrictions.timeBasedAccess.allowedHours}
                      onChange={(e) => setNewRole({
                        ...newRole,
                        restrictions: {
                          ...newRole.restrictions,
                          timeBasedAccess: {
                            ...newRole.restrictions.timeBasedAccess,
                            allowedHours: e.target.value
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              {createRoleStep === 4 && (
                <div className="step-form">
                  <h3 className="step-title">
                    <CheckCircle className="step-icon" />
                    Review & Create
                  </h3>
                  <p className="step-description">Review all role details before creating.</p>
                  
                  <div className="role-review">
                    <div className="review-section">
                      <h4>Basic Information</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <span className="review-label">Role Name:</span>
                          <span className="review-value">{newRole.name}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Display Name:</span>
                          <span className="review-value">{newRole.displayName}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Description:</span>
                          <span className="review-value">{newRole.description}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Priority:</span>
                          <span className="review-value">{newRole.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Permissions ({newRole.permissions.length})</h4>
                      <div className="permissions-summary">
                        {Object.entries(PERMISSION_CATEGORIES).map(([category, label]) => {
                          const categoryPerms = PERMISSIONS.filter(p => p.category === category && newRole.permissions.includes(p.key));
                          if (categoryPerms.length === 0) return null;
                          
                          return (
                            <div key={category} className="category-summary">
                              <h5>{label} ({categoryPerms.length})</h5>
                              <div className="permission-tags">
                                {categoryPerms.map(perm => (
                                  <span key={perm.key} className={`permission-tag ${perm.riskLevel}`}>
                                    {perm.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Security Settings</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <span className="review-label">MFA Required:</span>
                          <span className="review-value">{newRole.complianceSettings.requiresMFA ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Session Timeout:</span>
                          <span className="review-value">{newRole.complianceSettings.sessionTimeout}s</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Audit Level:</span>
                          <span className="review-value">{newRole.complianceSettings.auditLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions step-actions">
              <button 
                onClick={() => setShowCreateRole(false)} 
                className="futuristic-btn secondary enhanced"
                type="button"
              >
                <XCircle className="btn-icon" />
                Cancel
                <div className="btn-glow"></div>
              </button>

              <div className="step-navigation">
                {createRoleStep > 1 && (
                  <button 
                    onClick={prevRoleStep}
                    className="futuristic-btn secondary enhanced"
                    type="button"
                  >
                    <ArrowLeft className="btn-icon" />
                    Previous
                    <div className="btn-glow"></div>
                  </button>
                )}

                {createRoleStep < roleCreationSteps.length ? (
                  <button 
                    onClick={nextRoleStep}
                    className="futuristic-btn primary enhanced"
                    type="button"
                    disabled={!canProceedToNextRole}
                  >
                    Next
                    <ArrowLeft className="btn-icon" style={{ transform: 'rotate(180deg)' }} />
                    <div className="btn-glow"></div>
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateRole} 
                    className="futuristic-btn primary enhanced"
                    type="button"
                    disabled={!canProceedToNextRole || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="loading-spinner"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Crown className="btn-icon" />
                        Create Role
                      </>
                    )}
                    <div className="btn-glow"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix Modal */}
      {showPermissionMatrix && (
        <div className="modal-overlay">
          <div className="modal-content extra-large">
            <div className="modal-header">
              <h2>Permission Matrix</h2>
              <button 
                onClick={() => setShowPermissionMatrix(false)}
                className="modal-close"
              >
                <XCircle className="close-icon" />
              </button>
            </div>
            <div className="permission-matrix">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    {roles.map(role => (
                      <th key={role.id}>{role.displayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map(permission => (
                    <tr key={permission.key}>
                      <td className="permission-cell">
                        <span className="permission-name">{permission.label}</span>
                        <span className={`risk-badge ${permission.riskLevel}`}>
                          {permission.riskLevel}
                        </span>
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="role-cell">
                          {role.permissions.includes(permission.key) ? (
                            <CheckCircle className="permission-granted" />
                          ) : (
                            <XCircle className="permission-denied" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberDetails && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content extra-large">
            <div className="modal-header">
              <h2>Team Member Details</h2>
              <button 
                onClick={closeMemberDetailsModal}
                className="modal-close"
              >
                <XCircle className="close-icon" />
              </button>
            </div>
            
            <div className="member-details-content">
              <div className="member-overview">
                <div className="member-avatar large">
                  <span className="avatar-text">
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </span>
                </div>
                <div className="member-basic-info">
                  <h3>{selectedMember.firstName} {selectedMember.lastName}</h3>
                  <p>{selectedMember.email}</p>
                  <div className="member-status">
                    <span className={`status-badge ${selectedMember.isActive ? 'active' : 'inactive'}`}>
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="role-badge" style={{ backgroundColor: selectedMember.role.color + '20', color: selectedMember.role.color }}>
                      {selectedMember.role.displayName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed information tabs */}
              <div className="member-detail-tabs">
                <div className="tab-content">
                  {isEditingMember ? (
                    <div className="edit-member-form">
                      <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>First Name</label>
                            <input
                              type="text"
                              value={editMemberData.firstName}
                              onChange={(e) => setEditMemberData({...editMemberData, firstName: e.target.value})}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Last Name</label>
                            <input
                              type="text"
                              value={editMemberData.lastName}
                              onChange={(e) => setEditMemberData({...editMemberData, lastName: e.target.value})}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={editMemberData.email}
                              onChange={(e) => setEditMemberData({...editMemberData, email: e.target.value})}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Role</label>
                            <select
                              value={editMemberData.roleId}
                              onChange={(e) => setEditMemberData({...editMemberData, roleId: e.target.value})}
                              className="form-select"
                            >
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                  {role.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Access Level</label>
                            <select
                              value={editMemberData.accessLevel}
                              onChange={(e) => setEditMemberData({...editMemberData, accessLevel: e.target.value})}
                              className="form-select"
                            >
                              <option value="full">Full Access</option>
                              <option value="limited">Limited Access</option>
                              <option value="read_only">Read Only</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select
                              value={editMemberData.isActive ? 'active' : 'inactive'}
                              onChange={(e) => setEditMemberData({...editMemberData, isActive: e.target.value === 'active'})}
                              className="form-select"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-section">
                        <h3>Custom Permissions</h3>
                        <div className="permissions-grid">
                          {PERMISSIONS.map(permission => (
                            <label key={permission.key} className="permission-checkbox">
                              <input
                                type="checkbox"
                                checked={editMemberData.customPermissions.includes(permission.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditMemberData({
                                      ...editMemberData,
                                      customPermissions: [...editMemberData.customPermissions, permission.key]
                                    });
                                  } else {
                                    setEditMemberData({
                                      ...editMemberData,
                                      customPermissions: editMemberData.customPermissions.filter(p => p !== permission.key)
                                    });
                                  }
                                }}
                              />
                              <span className="permission-name">{permission.label}</span>
                              <span className={`risk-indicator ${permission.riskLevel}`}>
                                {permission.riskLevel}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="form-section">
                        <h3>Advanced Settings</h3>
                        <div className="form-group">
                          <label>Access Expires At (optional)</label>
                          <input
                            type="datetime-local"
                            value={editMemberData.expiresAt}
                            onChange={(e) => setEditMemberData({...editMemberData, expiresAt: e.target.value})}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="member-info-display">
                      <div className="info-section">
                        <h3>Member Information</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-label">Full Name:</span>
                            <span className="info-value">{selectedMember.firstName} {selectedMember.lastName}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{selectedMember.email}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Role:</span>
                            <span className="info-value">{selectedMember.role.displayName}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Access Level:</span>
                            <span className="info-value">{selectedMember.accessLevel}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Status:</span>
                            <span className={`info-value ${selectedMember.isActive ? 'active' : 'inactive'}`}>
                              {selectedMember.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Last Access:</span>
                            <span className="info-value">
                              {selectedMember.lastAccessAt ? new Date(selectedMember.lastAccessAt).toLocaleString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="info-section">
                        <h3>Permissions</h3>
                        <div className="permissions-display">
                          <div className="permission-category">
                            <h4>Role Permissions</h4>
                            <div className="permission-tags">
                              {selectedMember.role.permissions.map(permission => (
                                <span key={permission} className="permission-tag">
                                  {PERMISSIONS.find(p => p.key === permission)?.label || permission}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {selectedMember.customPermissions && selectedMember.customPermissions.length > 0 && (
                            <div className="permission-category">
                              <h4>Custom Permissions</h4>
                              <div className="permission-tags">
                                {selectedMember.customPermissions.map(permission => (
                                  <span key={permission} className="permission-tag custom">
                                    {PERMISSIONS.find(p => p.key === permission)?.label || permission}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="info-section">
                        <h3>Activity & Security</h3>
                        <div className="activity-stats">
                          <div className="stat-card">
                            <div className="stat-value">{selectedMember.riskScore}%</div>
                            <div className="stat-label">Risk Score</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{selectedMember.performanceMetrics?.tasksCompleted || 0}</div>
                            <div className="stat-label">Tasks Completed</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{selectedMember.performanceMetrics?.averageResponseTime || 0}ms</div>
                            <div className="stat-label">Avg Response Time</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              {isEditingMember ? (
                <>
                  <button 
                    onClick={cancelEditingMember} 
                    className="futuristic-btn secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveEditedMember}
                    className="futuristic-btn primary"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={closeMemberDetailsModal} 
                    className="futuristic-btn secondary"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => startEditingMember(selectedMember)}
                    className="futuristic-btn primary"
                  >
                    Edit Member
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts-help">
        <div className="shortcuts-toggle">
          <Keyboard className="shortcuts-icon" />
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="shortcuts-list">
          {Object.entries(KEYBOARD_SHORTCUTS).map(([key, action]) => (
            <div key={key} className="shortcut-item">
              <span className="shortcut-key">{key}</span>
              <span className="shortcut-action">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTeamManagement;