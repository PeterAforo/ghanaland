'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '../_components/admin-layout';

interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  accountStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Mock data for now - will connect to API
  const users: User[] = [
    {
      id: '1',
      email: 'john@example.com',
      phone: '0241234567',
      fullName: 'John Doe',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      roles: ['seller', 'buyer'],
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      email: 'jane@example.com',
      phone: '0209876543',
      fullName: 'Jane Smith',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
      roles: ['buyer'],
      createdAt: '2024-01-18T14:30:00Z',
    },
    {
      id: '3',
      email: 'agent@realestate.com',
      fullName: 'Real Estate Agent',
      accountStatus: 'PENDING_VERIFICATION',
      emailVerified: false,
      phoneVerified: false,
      roles: ['agent'],
      createdAt: '2024-01-20T09:15:00Z',
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || user.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">Manage user accounts and roles</p>
          </div>
          <Button variant="primary">
            <Users className="mr-2 h-4 w-4" />
            Export Users
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total Users" value={users.length} />
          <StatCard
            label="Active"
            value={users.filter((u) => u.accountStatus === 'ACTIVE').length}
          />
          <StatCard
            label="Pending Verification"
            value={users.filter((u) => u.accountStatus === 'PENDING_VERIFICATION').length}
          />
          <StatCard
            label="Suspended"
            value={users.filter((u) => u.accountStatus === 'SUSPENDED').length}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full sm:w-48 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Roles
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.emailVerified ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <XCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.phoneVerified ? (
                                <CheckCircle className="h-3 w-3 text-success" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={user.accountStatus} />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="neutral" className="capitalize text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No users found"
                  description="Try adjusting your search or filters"
                />
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="verified">Active</Badge>;
    case 'PENDING_VERIFICATION':
      return <Badge variant="pending">Pending</Badge>;
    case 'SUSPENDED':
      return <Badge variant="rejected">Suspended</Badge>;
    case 'DEACTIVATED':
      return <Badge variant="neutral">Deactivated</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
