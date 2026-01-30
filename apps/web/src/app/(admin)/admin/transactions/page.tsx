'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { formatPrice, formatDate } from '@/lib/utils';
import { AdminLayout } from '../_components/admin-layout';
import { API_BASE_URL } from '@/lib/api';

interface Transaction {
  id: string;
  listing: { title: string };
  buyer: { fullName: string };
  seller: { fullName: string };
  agreedPriceGhs: string;
  platformFeeGhs: string;
  status: string;
  escrowStatus?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface Stats {
  totalTransactions: number;
  totalVolume: string;
  totalFees: string;
  disputedCount: number;
}

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState<Stats>({ totalTransactions: 0, totalVolume: '0', totalFees: '0', disputedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const handleReleaseEscrow = async (transactionId: string) => {
    if (!confirm('Are you sure you want to release the escrow funds to the seller?')) return;
    
    setActionLoading(transactionId);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/escrow/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Escrow released successfully! Plots have been deducted from the listing.');
        fetchTransactions();
      } else {
        alert(`Failed to release escrow: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to release escrow:', error);
      alert('Failed to release escrow. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (transactionId: string, resolution: string) => {
    const notes = prompt('Enter resolution notes (optional):');
    
    setActionLoading(transactionId);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/escrow/resolve-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId, resolution, notes }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Dispute resolved successfully!');
        fetchTransactions();
      } else {
        alert(`Failed to resolve dispute: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      alert('Failed to resolve dispute. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`${API_BASE_URL}/api/v1/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setPagination(data.meta.pagination);
        if (data.meta.stats) {
          setStats(data.meta.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const filteredTransactions = transactions;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Monitor and manage escrow transactions</p>
          </div>
          <Button variant="primary">
            <CreditCard className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{formatPrice(parseFloat(stats.totalVolume))}</p>
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-primary">{formatPrice(parseFloat(stats.totalFees))}</p>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-warning">
                {stats.disputedCount}
              </p>
              <p className="text-sm text-muted-foreground">Disputed</p>
            </CardContent>
          </Card>
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
                  placeholder="Search by ID, listing, buyer, or seller..."
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full sm:w-48 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="CREATED">Created</option>
                <option value="ESCROW_FUNDED">Escrow Funded</option>
                <option value="VERIFICATION_PERIOD">Verification Period</option>
                <option value="DISPUTED">Disputed</option>
                <option value="READY_TO_RELEASE">Ready to Release</option>
                <option value="RELEASED">Released</option>
                <option value="REFUNDED">Refunded</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Transaction
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Parties
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-mono text-sm font-medium text-foreground">{txn.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {txn.listing?.title || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowDownLeft className="h-3 w-3 text-success" />
                            <span className="text-foreground">{txn.buyer.fullName}</span>
                            <Badge variant="neutral" className="text-xs">
                              Buyer
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowUpRight className="h-3 w-3 text-primary" />
                            <span className="text-foreground">{txn.seller.fullName}</span>
                            <Badge variant="neutral" className="text-xs">
                              Seller
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">
                          {formatPrice(parseFloat(txn.agreedPriceGhs))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: {formatPrice(parseFloat(txn.platformFeeGhs))}
                        </p>
                      </td>
                      <td className="p-4">
                        <TransactionStatusBadge status={txn.status} />
                        {txn.escrowStatus && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Escrow: {txn.escrowStatus}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {txn.status === 'DISPUTED' && (
                            <>
                              <Button 
                                variant="primary" 
                                size="sm"
                                disabled={actionLoading === txn.id}
                                onClick={() => handleResolveDispute(txn.id, 'RELEASE_TO_SELLER')}
                              >
                                {actionLoading === txn.id ? 'Processing...' : 'Release to Seller'}
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                disabled={actionLoading === txn.id}
                                onClick={() => handleResolveDispute(txn.id, 'REFUND_TO_BUYER')}
                              >
                                Refund Buyer
                              </Button>
                            </>
                          )}
                          {(txn.status === 'ESCROW_FUNDED' || txn.status === 'READY_TO_RELEASE') && (
                            <Button 
                              variant="primary" 
                              size="sm"
                              disabled={actionLoading === txn.id}
                              onClick={() => handleReleaseEscrow(txn.id)}
                            >
                              {actionLoading === txn.id ? 'Releasing...' : 'Release Escrow'}
                            </Button>
                          )}
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

            {filteredTransactions.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<CreditCard className="h-6 w-6" />}
                  title="No transactions found"
                  description="Try adjusting your search or filters"
                />
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {transactions.length} of {pagination.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={page >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => setPage(p => p + 1)}
                >
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

function TransactionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'CREATED':
      return <Badge variant="neutral">Created</Badge>;
    case 'ESCROW_FUNDED':
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3 mr-1" />
          Escrow Funded
        </Badge>
      );
    case 'VERIFICATION_PERIOD':
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3 mr-1" />
          Verification
        </Badge>
      );
    case 'DISPUTED':
      return (
        <Badge variant="rejected">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Disputed
        </Badge>
      );
    case 'READY_TO_RELEASE':
      return (
        <Badge variant="warning">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    case 'RELEASED':
      return (
        <Badge variant="verified">
          <CheckCircle className="h-3 w-3 mr-1" />
          Released
        </Badge>
      );
    case 'REFUNDED':
      return (
        <Badge variant="neutral">
          <XCircle className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="verified">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
