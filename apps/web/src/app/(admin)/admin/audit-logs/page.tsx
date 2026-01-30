'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Shield,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <FileText className="h-4 w-4 text-green-600" />,
  UPDATE: <Activity className="h-4 w-4 text-blue-600" />,
  DELETE: <XCircle className="h-4 w-4 text-red-600" />,
  LOGIN: <User className="h-4 w-4 text-purple-600" />,
  LOGOUT: <User className="h-4 w-4 text-gray-600" />,
  VERIFY: <Shield className="h-4 w-4 text-green-600" />,
  REJECT: <XCircle className="h-4 w-4 text-red-600" />,
  APPROVE: <CheckCircle className="h-4 w-4 text-green-600" />,
  PAYMENT: <DollarSign className="h-4 w-4 text-yellow-600" />,
  ESCROW_RELEASE: <DollarSign className="h-4 w-4 text-green-600" />,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  VERIFY: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
  APPROVE: 'bg-green-100 text-green-800',
  PAYMENT: 'bg-yellow-100 text-yellow-800',
  ESCROW_RELEASE: 'bg-green-100 text-green-800',
};

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'USER', label: 'Users' },
  { value: 'LISTING', label: 'Listings' },
  { value: 'TRANSACTION', label: 'Transactions' },
  { value: 'VERIFICATION', label: 'Verifications' },
  { value: 'PERMIT', label: 'Permits' },
  { value: 'SERVICE_REQUEST', label: 'Service Requests' },
  { value: 'DOCUMENT', label: 'Documents' },
  { value: 'PAYMENT', label: 'Payments' },
];

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'VERIFY', label: 'Verify' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'ESCROW_RELEASE', label: 'Escrow Release' },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter, page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (entityFilter) params.append('entityType', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '25');

      const res = await fetch(
        `${API_BASE_URL}/api/v1/admin/audit-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || data.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getActionBadge = (action: string) => {
    const color = ACTION_COLORS[action] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatMetadata = (metadata: Record<string, any> | null) => {
    if (!metadata) return null;
    return Object.entries(metadata).map(([key, value]) => (
      <div key={key} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
        <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
        <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activity and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} total logs</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, entity ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-background px-3 py-2 min-w-[150px]"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-background px-3 py-2 min-w-[150px]"
            >
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setEntityFilter('');
                setActionFilter('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLog?.id === log.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getActionBadge(log.action)}
                              <span className="text-xs text-muted-foreground">
                                {log.entityType}
                              </span>
                            </div>
                            <p className="text-sm font-medium">
                              {log.userName || log.userEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log Details Panel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Log Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Action</label>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Entity</label>
                    <p className="font-medium">{selectedLog.entityType}</p>
                    <p className="text-xs text-muted-foreground font-mono">{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">User</label>
                    <p className="font-medium">{selectedLog.userName}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Timestamp</label>
                    <p className="font-medium">
                      {format(new Date(selectedLog.createdAt), 'PPpp')}
                    </p>
                  </div>
                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-xs text-muted-foreground">IP Address</label>
                      <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Metadata</label>
                      <div className="bg-muted rounded-lg p-3">
                        {formatMetadata(selectedLog.metadata)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a log entry to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
