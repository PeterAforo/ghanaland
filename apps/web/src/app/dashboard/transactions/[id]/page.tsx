'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  FileText,
  Shield,
  Loader2,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface Payment {
  id: string;
  amountGhs: string;
  type: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

interface InstallmentScheduleItem {
  installmentNumber: number;
  type: 'INITIAL_DEPOSIT' | 'MONTHLY_INSTALLMENT';
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  plotCount?: number;
  agreedPriceGhs: string;
  platformFeeGhs: string;
  sellerNetGhs: string;
  status: string;
  escrowStatus?: string;
  paymentType?: string;
  installmentSchedule?: InstallmentScheduleItem[];
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    pricePerPlot?: string;
    media?: { url: string }[];
  };
  buyer: {
    id: string;
    fullName: string;
    phone?: string;
  };
  seller: {
    id: string;
    fullName: string;
    phone?: string;
  };
  payments: Payment[];
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/escrow/transaction/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (result.success) {
        setTransaction(result.data);
      } else {
        setError(result.error?.message || 'Failed to load transaction');
      }
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!transaction) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Calculate next payment amount from completed payments
      const paidAmt = transaction.payments
        ?.filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amountGhs || '0'), 0) || 0;
      const totalAmt = parseFloat(transaction.agreedPriceGhs || '0');
      const remainingAmount = Math.max(0, totalAmt - paidAmt);
      
      // For installments, calculate monthly payment
      // For now, just pay the remaining amount
      const paymentAmount = remainingAmount;

      const res = await fetch(`${API_BASE_URL}/api/v1/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          amount: paymentAmount,
          paymentType: 'INSTALLMENT',
          returnUrl: `${window.location.origin}/dashboard/transactions/${transaction.id}`,
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        setError(result.error?.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!transaction || !confirm('Are you sure you want to cancel this transaction?')) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/escrow/transaction/${transaction.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (result.success) {
        router.push('/dashboard/transactions');
      } else {
        setError(result.error?.message || 'Failed to cancel transaction');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transaction) return;

    // Find the processing payment
    const processingPayment = transaction.payments?.find(p => p.status === 'PROCESSING');
    if (!processingPayment) return;

    setIsProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/payments/${processingPayment.id}/simulate-success`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (result.received) {
        // Refresh transaction data
        await fetchTransaction();
      } else {
        setError('Failed to confirm payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <TransactionDetailSkeleton />;
  }

  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error || 'Transaction not found'}</p>
            <Link href="/dashboard/transactions">
              <Button variant="primary">Back to Transactions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBuyer = transaction.buyerId === user?.id;
  const otherParty = isBuyer ? transaction.seller : transaction.buyer;
  // Calculate paid amount from completed payments
  const paidAmount = transaction.payments
    ?.filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amountGhs || '0'), 0) || 0;
  const totalAmount = parseFloat(transaction.agreedPriceGhs || '0');
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const canMakePayment = isBuyer && 
    ['CREATED', 'INITIATED', 'DEPOSIT_PAID', 'IN_PROGRESS', 'ESCROW_FUNDED'].includes(transaction.status) &&
    remainingAmount > 0;

  const canCancel = isBuyer && 
    ['CREATED', 'INITIATED'].includes(transaction.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isBuyer ? (
                <Badge variant="neutral">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Purchase
                </Badge>
              ) : (
                <Badge variant="neutral">
                  <ArrowDownLeft className="h-3 w-3 mr-1" />
                  Sale
                </Badge>
              )}
              <TransactionStatusBadge status={transaction.status} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Transaction Details</h1>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/listings/${transaction.listing.id}`} className="block">
                <div className="flex gap-4">
                  <div className="w-24 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {transaction.listing.media && transaction.listing.media.length > 0 ? (
                      <img
                        src={transaction.listing.media[0].url}
                        alt={transaction.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {transaction.listing.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.listing.district}, {transaction.listing.region}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {transaction.plotCount || 1} plot{(transaction.plotCount || 1) > 1 ? 's' : ''}
                      {transaction.listing.pricePerPlot && (
                        <> @ {formatPrice(parseFloat(transaction.listing.pricePerPlot))} each</>
                      )}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Payment Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {formatPrice(paidAmount)} paid of {formatPrice(totalAmount)}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold text-foreground">{formatPrice(totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-bold text-foreground">{formatPrice(remainingAmount)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Payment Type</p>
                  <Badge variant="neutral">
                    {transaction.paymentType === 'INSTALLMENT' ? 'Installments' : 'Full Payment'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installment Schedule */}
          {transaction.paymentType === 'INSTALLMENT' && transaction.installmentSchedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.installmentSchedule.map((item, index) => {
                    const dueDate = new Date(item.dueDate);
                    const isPaid = transaction.payments?.some(
                      p => p.status === 'COMPLETED' && 
                      Math.abs(parseFloat(p.amountGhs) - item.amount) < 1
                    );
                    const isOverdue = !isPaid && dueDate < new Date();
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isPaid ? 'bg-green-50 border-green-200' : 
                          isOverdue ? 'bg-red-50 border-red-200' : 
                          'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isPaid ? 'bg-green-100' : 
                            isOverdue ? 'bg-red-100' : 'bg-muted'
                          }`}>
                            {isPaid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : isOverdue ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {item.type === 'INITIAL_DEPOSIT' ? 'Initial Deposit' : `Installment ${item.installmentNumber}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Due: {formatDate(item.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.amount)}</p>
                          <Badge 
                            variant={isPaid ? 'verified' : isOverdue ? 'rejected' : 'neutral'} 
                            className="text-xs"
                          >
                            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.payments && transaction.payments.length > 0 ? (
                <div className="space-y-3">
                  {transaction.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          payment.status === 'COMPLETED' ? 'bg-green-100' : 
                          payment.status === 'FAILED' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {payment.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : payment.status === 'FAILED' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{payment.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(parseFloat(payment.amountGhs))}</p>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No payments recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canMakePayment && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleMakePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment - {formatPrice(remainingAmount)}
                    </>
                  )}
                </Button>
              )}

              {/* Dev mode: Confirm processing payments */}
              {transaction.payments?.some(p => p.status === 'PROCESSING') && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment (Dev)
                    </>
                  )}
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive"
                  onClick={handleCancelTransaction}
                  disabled={isProcessing}
                >
                  Cancel Transaction
                </Button>
              )}

              {transaction.status === 'COMPLETED' && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Transaction Complete</p>
                  <p className="text-xs text-green-600 mt-1">
                    All payments have been received
                  </p>
                </div>
              )}

              {transaction.status === 'CANCELLED' && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-800">Transaction Cancelled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Party */}
          <Card>
            <CardHeader>
              <CardTitle>{isBuyer ? 'Seller' : 'Buyer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{otherParty.fullName}</p>
                  {otherParty.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {otherParty.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono">{transaction.id.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(transaction.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <p className="text-xs">
                  Funds are held in escrow until the transaction is complete
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TransactionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'INITIATED':
      return <Badge variant="neutral">Initiated</Badge>;
    case 'DEPOSIT_PAID':
      return <Badge variant="pending">Deposit Paid</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="pending">In Progress</Badge>;
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

function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="verified" className="text-xs">Paid</Badge>;
    case 'FAILED':
      return <Badge variant="rejected" className="text-xs">Failed</Badge>;
    case 'PENDING':
      return <Badge variant="pending" className="text-xs">Pending</Badge>;
    default:
      return <Badge variant="neutral" className="text-xs">{status}</Badge>;
  }
}

function TransactionDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
