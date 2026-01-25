'use client';

import { useState } from 'react';
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

interface Transaction {
  id: string;
  listingTitle: string;
  buyer: { fullName: string };
  seller: { fullName: string };
  agreedPriceGhs: number;
  platformFeeGhs: number;
  status: string;
  escrowStatus?: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Mock data
  const transactions: Transaction[] = [
    {
      id: 'TXN-2024-001',
      listingTitle: '5 Acres Prime Land in East Legon',
      buyer: { fullName: 'Alice Johnson' },
      seller: { fullName: 'John Doe' },
      agreedPriceGhs: 2500000,
      platformFeeGhs: 125000,
      status: 'ESCROW_FUNDED',
      escrowStatus: 'FUNDED',
      createdAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 'TXN-2024-002',
      listingTitle: 'Commercial Plot in Tema',
      buyer: { fullName: 'Bob Williams' },
      seller: { fullName: 'Jane Smith' },
      agreedPriceGhs: 5000000,
      platformFeeGhs: 250000,
      status: 'VERIFICATION_PERIOD',
      escrowStatus: 'FUNDED',
      createdAt: '2024-01-18T14:30:00Z',
    },
    {
      id: 'TXN-2024-003',
      listingTitle: 'Residential Land in Kumasi',
      buyer: { fullName: 'Charles Brown' },
      seller: { fullName: 'Kwame Asante' },
      agreedPriceGhs: 800000,
      platformFeeGhs: 40000,
      status: 'DISPUTED',
      escrowStatus: 'FUNDED',
      createdAt: '2024-01-15T09:15:00Z',
    },
    {
      id: 'TXN-2024-004',
      listingTitle: 'Agricultural Land in Volta',
      buyer: { fullName: 'Diana Evans' },
      seller: { fullName: 'Emmanuel Mensah' },
      agreedPriceGhs: 1200000,
      platformFeeGhs: 60000,
      status: 'COMPLETED',
      escrowStatus: 'RELEASED',
      createdAt: '2024-01-10T11:00:00Z',
    },
  ];

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      !search ||
      txn.id.toLowerCase().includes(search.toLowerCase()) ||
      txn.listingTitle.toLowerCase().includes(search.toLowerCase()) ||
      txn.buyer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      txn.seller.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVolume = transactions.reduce((sum, t) => sum + t.agreedPriceGhs, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.platformFeeGhs, 0);

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
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{formatPrice(totalVolume)}</p>
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-primary">{formatPrice(totalFees)}</p>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-warning">
                {transactions.filter((t) => t.status === 'DISPUTED').length}
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
                          <p className="font-mono text-sm font-medium text-foreground">{txn.id}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {txn.listingTitle}
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
                          {formatPrice(txn.agreedPriceGhs)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: {formatPrice(txn.platformFeeGhs)}
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
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          {txn.status === 'DISPUTED' && (
                            <Button variant="secondary" size="sm">
                              Resolve
                            </Button>
                          )}
                          {txn.status === 'READY_TO_RELEASE' && (
                            <Button variant="primary" size="sm">
                              Release
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
                Showing {filteredTransactions.length} of {transactions.length} transactions
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
