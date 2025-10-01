# Admin Frontend Development Guide

## Sports Companion API - Admin Dashboard Integration

This guide is specifically for frontend developers building admin dashboards and administrative interfaces for the Sports Companion platform.

---

## Table of Contents

1. [Admin Authentication](#admin-authentication)
2. [Admin API Overview](#admin-api-overview)
3. [Analytics Dashboard](#analytics-dashboard)
4. [User Management](#user-management)
5. [System Monitoring](#system-monitoring)
6. [Insights & Reports](#insights--reports)
7. [Security Considerations](#security-considerations)
8. [Admin UI Components](#admin-ui-components)
9. [Best Practices](#best-practices)

---

## Admin Authentication

### Role-Based Access Control

```javascript
// Check if user has admin privileges
const isAdmin = (user) => user && user.role === 'admin';

// Admin route guard for React Router
const AdminRoute = ({ children }) => {
  const user = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin(user)) {
    return <AccessDenied message="Admin privileges required" />;
  }
  
  return children;
};

// Usage in routes
<Route path="/admin/*" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```

### Admin API Client

```javascript
// Create admin-specific API client
class AdminApiClient {
  constructor(baseURL = '/api/v1/admin') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    const user = getCurrentUser();
    
    // Verify admin access
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Admin API request failed');
    }

    return response.json();
  }

  // Analytics methods
  getAnalyticsDashboard(timeframe = 'week') {
    return this.request(`/analytics/dashboard?timeframe=${timeframe}`);
  }

  getUserEngagementAnalytics(startDate, endDate, filters = {}) {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...filters
    });
    return this.request(`/analytics/user-engagement?${params}`);
  }

  getPerformanceAnalytics(startDate, endDate, filters = {}) {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...filters
    });
    return this.request(`/analytics/performance?${params}`);
  }

  generateCustomReport(reportData) {
    return this.request('/analytics/reports/custom', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  // System management methods
  getSystemOverview(includeDeep = false) {
    return this.request(`/system/overview?deep=${includeDeep}`);
  }

  getUserManagement(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/users/management?${params}`);
  }

  // Insights methods
  getApplicationInsights() {
    return this.request('/insights/application');
  }

  getCompetitiveInsights() {
    return this.request('/insights/competitive');
  }
}

// Initialize admin API client
const adminApi = new AdminApiClient();
```

---

## Analytics Dashboard

### Dashboard Components

```javascript
// Main Analytics Dashboard
const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAnalyticsDashboard(timeframe);
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="analytics-dashboard">
      <DashboardHeader 
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />
      
      <div className="dashboard-grid">
        <MetricsCards metrics={dashboardData.dashboard} />
        <UserActivityChart data={dashboardData.dashboard.userActivities} />
        <PerformanceChart data={dashboardData.dashboard.requestsPerMinute} />
        <SystemHealthPanel health={dashboardData.dashboard.systemHealth} />
        <TopEndpointsTable endpoints={dashboardData.dashboard.topEndpoints} />
      </div>
    </div>
  );
};

// Metrics Cards Component
const MetricsCards = ({ metrics }) => (
  <div className="metrics-grid">
    <MetricCard
      title="Active Users"
      value={metrics.activeUsers}
      icon="👥"
      trend={"+12.5%"}
    />
    <MetricCard
      title="Avg Response Time"
      value={`${metrics.avgResponseTime}ms`}
      icon="⚡"
      trend={"-5.2%"}
      trendType="improvement"
    />
    <MetricCard
      title="Error Rate"
      value={`${(metrics.errorRate * 100).toFixed(2)}%`}
      icon="🚨"
      trend={"-0.1%"}
      trendType="improvement"
    />
  </div>
);

// User Activity Chart
const UserActivityChart = ({ data }) => {
  // Use your preferred charting library (Chart.js, Recharts, etc.)
  return (
    <div className="chart-container">
      <h3>User Activity Timeline</h3>
      <LineChart data={data} />
    </div>
  );
};
```

### Real-time Dashboard Updates

```javascript
// Real-time dashboard with WebSocket
const RealtimeDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join admin dashboard room
    socket.emit('join-room', 'admin:dashboard');

    // Listen for real-time metrics updates
    socket.on('admin:metrics-update', (newMetrics) => {
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        ...newMetrics
      }));
    });

    // Listen for system alerts
    socket.on('admin:system-alert', (alert) => {
      showAlert(alert);
    });

    return () => {
      socket.off('admin:metrics-update');
      socket.off('admin:system-alert');
    };
  }, [socket]);

  return (
    <div className="realtime-dashboard">
      <RealtimeMetrics metrics={metrics} />
    </div>
  );
};
```

---

## User Management

### User Management Interface

```javascript
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 50
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserManagement(filters);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'suspend':
          await adminApi.suspendUser(userId);
          break;
        case 'activate':
          await adminApi.activateUser(userId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this user?')) {
            await adminApi.deleteUser(userId);
          }
          break;
      }
      loadUsers(); // Refresh list
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  return (
    <div className="user-management">
      <UserManagementHeader 
        summary={users.summary}
        onStatusFilter={handleStatusFilter}
      />
      
      <UserTable
        users={users.users}
        onUserAction={handleUserAction}
        loading={loading}
      />
      
      <Pagination
        current={filters.page}
        total={users.pagination?.pages}
        onChange={(page) => setFilters(prev => ({ ...prev, page }))}
      />
    </div>
  );
};

// User Table Component
const UserTable = ({ users, onUserAction, loading }) => {
  if (loading) return <TableSkeleton />;

  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Status</th>
          <th>Last Login</th>
          <th>Matches</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              <div className="user-info">
                <div className="user-name">
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-id">{user.id}</div>
              </div>
            </td>
            <td>{user.email}</td>
            <td>
              <StatusBadge status={user.status} />
            </td>
            <td>
              {user.lastLoginAt ? 
                formatDate(user.lastLoginAt) : 
                'Never'
              }
            </td>
            <td>{user.matchesPlayed}</td>
            <td>
              <UserActions 
                user={user}
                onAction={(action) => onUserAction(user.id, action)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## System Monitoring

### System Health Dashboard

```javascript
const SystemMonitoring = () => {
  const [systemData, setSystemData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const data = await adminApi.getSystemOverview(true);
      setSystemData(data.data);
      
      // Check for alerts
      checkSystemAlerts(data.data);
    } catch (error) {
      console.error('Failed to load system data:', error);
    }
  };

  const checkSystemAlerts = (data) => {
    const newAlerts = [];
    
    if (data.performanceProfile.averageResponseTime > 500) {
      newAlerts.push({
        type: 'warning',
        message: 'High response times detected'
      });
    }
    
    if (data.systemOverview.memoryUsage.heapUsed / data.systemOverview.memoryUsage.heapTotal > 0.9) {
      newAlerts.push({
        type: 'critical',
        message: 'High memory usage'
      });
    }
    
    setAlerts(newAlerts);
  };

  return (
    <div className="system-monitoring">
      <SystemAlerts alerts={alerts} />
      
      <div className="monitoring-grid">
        <SystemOverviewCard overview={systemData?.systemOverview} />
        <PerformanceMetrics performance={systemData?.performanceProfile} />
        <SecurityMetrics security={systemData?.securityMetrics} />
        <DatabaseStatus database={systemData?.database} />
      </div>
    </div>
  );
};

// System Overview Card
const SystemOverviewCard = ({ overview }) => (
  <div className="system-card">
    <h3>System Overview</h3>
    <div className="system-metrics">
      <Metric label="Total Users" value={overview?.totalUsers} />
      <Metric label="Total Matches" value={overview?.totalMatches} />
      <Metric label="Uptime" value={formatUptime(overview?.systemUptime)} />
      <Metric 
        label="Memory Usage" 
        value={`${((overview?.memoryUsage.heapUsed / overview?.memoryUsage.heapTotal) * 100).toFixed(1)}%`}
      />
    </div>
  </div>
);
```

---

## Insights & Reports

### Custom Report Builder

```javascript
const ReportBuilder = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'user_retention',
    startDate: '',
    endDate: '',
    dimensions: [],
    metrics: [],
    filters: {}
  });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'user_retention', label: 'User Retention Analysis' },
    { value: 'feature_adoption', label: 'Feature Adoption Report' },
    { value: 'performance_summary', label: 'Performance Summary' },
    { value: 'revenue_analysis', label: 'Revenue Analysis' }
  ];

  const availableDimensions = [
    { value: 'user_type', label: 'User Type' },
    { value: 'location', label: 'Location' },
    { value: 'registration_source', label: 'Registration Source' },
    { value: 'sport_preference', label: 'Sport Preference' }
  ];

  const availableMetrics = [
    { value: 'active_users', label: 'Active Users' },
    { value: 'retention_rate', label: 'Retention Rate' },
    { value: 'engagement_score', label: 'Engagement Score' },
    { value: 'conversion_rate', label: 'Conversion Rate' }
  ];

  const generateReport = async () => {
    try {
      setGenerating(true);
      const report = await adminApi.generateCustomReport(reportConfig);
      setGeneratedReport(report.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="report-builder">
      <div className="report-config">
        <h3>Report Configuration</h3>
        
        <FormField label="Report Type">
          <Select
            value={reportConfig.reportType}
            onChange={(value) => setReportConfig(prev => ({ ...prev, reportType: value }))}
            options={reportTypes}
          />
        </FormField>

        <DateRangePicker
          startDate={reportConfig.startDate}
          endDate={reportConfig.endDate}
          onChange={(startDate, endDate) => 
            setReportConfig(prev => ({ ...prev, startDate, endDate }))
          }
        />

        <MultiSelect
          label="Dimensions"
          options={availableDimensions}
          value={reportConfig.dimensions}
          onChange={(dimensions) => 
            setReportConfig(prev => ({ ...prev, dimensions }))
          }
        />

        <MultiSelect
          label="Metrics"
          options={availableMetrics}
          value={reportConfig.metrics}
          onChange={(metrics) => 
            setReportConfig(prev => ({ ...prev, metrics }))
          }
        />

        <Button 
          onClick={generateReport}
          loading={generating}
          disabled={!reportConfig.startDate || !reportConfig.endDate}
        >
          Generate Report
        </Button>
      </div>

      {generatedReport && (
        <div className="generated-report">
          <ReportViewer report={generatedReport} />
        </div>
      )}
    </div>
  );
};
```

---

## Security Considerations

### Admin Session Management

```javascript
// Enhanced session management for admin users
const useAdminSession = () => {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    // Check admin session every 5 minutes
    const checkSession = async () => {
      try {
        const user = await adminApi.getCurrentUser();
        if (!user || user.role !== 'admin') {
          throw new Error('Admin session invalid');
        }
        setSession(user);
      } catch (error) {
        // Admin session expired or invalid
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return session;
};

// Admin action logging
const logAdminAction = async (action, details) => {
  try {
    await adminApi.logAction({
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: await getClientIP()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// Usage in admin actions
const handleUserSuspension = async (userId) => {
  try {
    await adminApi.suspendUser(userId);
    await logAdminAction('USER_SUSPENDED', { userId });
    showSuccess('User suspended successfully');
  } catch (error) {
    console.error('Failed to suspend user:', error);
  }
};
```

### Rate Limiting for Admin Operations

```javascript
// Admin-specific rate limiting awareness
const AdminRateLimiter = {
  requests: new Map(),
  
  checkLimit: (endpoint, limit = 100, window = 60000) => { // 100 requests per minute
    const now = Date.now();
    const key = endpoint;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
};
```

---

## Admin UI Components

### Reusable Admin Components

```javascript
// Admin Layout Component
const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <AdminSidebar />
    <div className="admin-main">
      <AdminHeader />
      <div className="admin-content">
        {children}
      </div>
    </div>
  </div>
);

// Admin Sidebar Navigation
const AdminSidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/system', label: 'System Health', icon: '🔧' },
    { path: '/admin/reports', label: 'Reports', icon: '📋' },
    { path: '/admin/insights', label: 'Insights', icon: '💡' }
  ];
  
  return (
    <nav className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <ul className="nav-list">
        {navItems.map(item => (
          <li key={item.path}>
            <Link 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Data Table with Admin Features
const AdminDataTable = ({ 
  data, 
  columns, 
  onSort, 
  onFilter, 
  onExport,
  loading 
}) => (
  <div className="admin-data-table">
    <div className="table-controls">
      <SearchInput onSearch={onFilter} />
      <ExportButton onClick={onExport} />
    </div>
    
    <table className="data-table">
      <thead>
        <tr>
          {columns.map(column => (
            <th 
              key={column.key}
              onClick={() => onSort(column.key)}
              className={column.sortable ? 'sortable' : ''}
            >
              {column.title}
              {column.sortable && <SortIcon />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <TableSkeleton columns={columns.length} />
        ) : (
          data.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? 
                    column.render(row[column.key], row) : 
                    row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
```

---

## Best Practices

### Performance Optimization

```javascript
// Optimize admin dashboard with data caching
const useAdminCache = () => {
  const cache = useRef(new Map());
  
  const getCachedData = (key, fetcher, ttl = 5 * 60 * 1000) => {
    const cached = cache.current.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    return fetcher().then(data => {
      cache.current.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    });
  };
  
  const invalidateCache = (key) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  };
  
  return { getCachedData, invalidateCache };
};

// Pagination for large datasets
const usePagination = (data, itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};
```

### Error Handling

```javascript
// Admin-specific error handling
const AdminErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleError = (error) => {
      console.error('Admin Error:', error);
      
      if (error.message.includes('Admin access required')) {
        window.location.href = '/login';
        return;
      }
      
      setError(error);
      setHasError(true);
    };
    
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="admin-error">
        <h2>Admin Dashboard Error</h2>
        <p>Something went wrong in the admin panel.</p>
        <details>
          <summary>Error Details</summary>
          <pre>{error?.stack}</pre>
        </details>
        <button onClick={() => window.location.reload()}>
          Reload Dashboard
        </button>
      </div>
    );
  }
  
  return children;
};
```

---

This guide provides everything needed to build comprehensive admin dashboards that work seamlessly with the separated admin API endpoints. The components and patterns shown here ensure proper security, performance, and user experience for administrative functionality.