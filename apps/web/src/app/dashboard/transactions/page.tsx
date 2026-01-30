'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  plotCount?: number;
  agreedPriceGhs: string;
  status: string;
  escrowStatus?: string;
  paymentType?: string;
  installmentSchedule?: any[];
  createdAt: string;
  payments?: { amountGhs: string; status: string }[];
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    media?: { url: string }[];
  };
  buyer: {
    id: string;
    fullName: string;
  };
  seller: {
    id: string;
    fullName: string;
  };
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/escrow/my-transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        setError(result.error?.message || 'Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    // Filter by role (buying/selling)
    if (filter === 'buying' && tx.buyerId !== user?.id) return false;
    if (filter === 'selling' && tx.sellerId !== user?.id) return false;
    
    // Filter by status
    if (statusFilter && tx.status !== statusFilter) return false;
    
    return true;
  });

  const stats = {
    total: transactions.length,
    asBuyer: transactions.filter(tx => tx.buyerId === user?.id).length,
    asSeller: transactions.filter(tx => tx.sellerId === user?.id).length,
    pending: transactions.filter(tx => ['CREATED', 'INITIATED', 'DEPOSIT_PAID', 'IN_PROGRESS', 'ESCROW_FUNDED', 'VERIFICATION_PERIOD', 'READY_TO_RELEASE'].includes(tx.status)).length,
    completed: transactions.filter(tx => ['COMPLETED', 'RELEASED'].includes(tx.status)).length,
  };

  if (isLoading) {
    return <TransactionsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.asBuyer}</p>
                <p className="text-sm text-muted-foreground">Purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.asSeller}</p>
                <p className="text-sm text-muted-foreground">Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'buying' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('buying')}
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Purchases
              </Button>
              <Button
                variant={filter === 'selling' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('selling')}
              >
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                Sales
              </Button>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full sm:w-48 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="ESCROW_FUNDED">Escrow Funded</option>
              <option value="VERIFICATION_PERIOD">Verification</option>
              <option value="READY_TO_RELEASE">Ready to Release</option>
              <option value="RELEASED">Released</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<CreditCard className="h-6 w-6" />}
              title="No transactions yet"
              description={
                filter === 'buying'
                  ? "You haven't made any purchases yet"
                  : filter === 'selling'
                  ? "You haven't received any sales yet"
                  : "Your transactions will appear here"
              }
              action={
                <Link href="/listings">
                  <Button variant="primary">Browse Listings</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionCard({ transaction: tx, currentUserId }: { transaction: Transaction; currentUserId?: string }) {
  const isBuyer = tx.buyerId === currentUserId;
  const otherParty = isBuyer ? tx.seller : tx.buyer;
  const paidAmount = tx.payments
    ?.filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amountGhs || '0'), 0) || 0;
  const totalAmount = parseFloat(tx.agreedPriceGhs || '0');
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <Link href={`/dashboard/transactions/${tx.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Image */}
            <div className="w-full lg:w-24 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {tx.listing.media && tx.listing.media.length > 0 ? (
                <img
                  src={tx.listing.media[0].url}
                  alt={tx.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isBuyer ? (
                      <Badge variant="neutral" className="text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Purchase
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">
                        <ArrowDownLeft className="h-3 w-3 mr-1" />
                        Sale
                      </Badge>
                    )}
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                  <h3 className="font-semibold text-foreground">{tx.listing.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tx.listing.district}, {tx.listing.region}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatPrice(totalAmount)}
                </span>
                <span>{tx.plotCount || 1} plot{(tx.plotCount || 1) > 1 ? 's' : ''}</span>
                <Badge variant="neutral" className="text-xs">
                  {tx.paymentType === 'INSTALLMENT' ? 'Installment' : 'Full Payment'}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(tx.createdAt)}
                </span>
                <span>
                  {isBuyer ? 'From' : 'To'}: {otherParty.fullName}
                </span>
              </div>

              {/* Progress bar for installments */}
              {tx.status !== 'COMPLETED' && tx.status !== 'CANCELLED' && progress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Payment Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground hidden lg:block" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TransactionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'CREATED':
      return <Badge variant="neutral">Created</Badge>;
    case 'ESCROW_FUNDED':
      return <Badge variant="pending">Escrow Funded</Badge>;
    case 'VERIFICATION_PERIOD':
      return <Badge variant="pending">Verification</Badge>;
    case 'READY_TO_RELEASE':
      return <Badge variant="warning">Ready to Release</Badge>;
    case 'RELEASED':
      return <Badge variant="verified">Released</Badge>;
    case 'COMPLETED':
      return <Badge variant="verified">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="rejected">Cancelled</Badge>;
    case 'DISPUTED':
      return <Badge variant="rejected">Disputed</Badge>;
    case 'REFUNDED':
      return <Badge variant="neutral">Refunded</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function TransactionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
