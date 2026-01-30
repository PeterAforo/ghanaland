'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, AlertCircle, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { API_BASE_URL } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ServiceRequest {
  id: string;
  description: string;
  status: string;
  agreedPriceGhs: number | null;
  platformFeeGhs: number | null;
  professionalNetGhs: number | null;
  paymentStatus: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  escrowFundedAt: string | null;
  escrowReleasedAt: string | null;
  client: {
    id: string;
    fullName: string;
    email: string;
  };
  professional: {
    id: string;
    title: string;
    user: {
      id: string;
      fullName: string;
    };
  };
  service: {
    id: string;
    name: string;
    priceGhs: number;
  } | null;
  listing: {
    id: string;
    title: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACCEPTED: { label: 'Awaiting Payment', color: 'bg-blue-100 text-blue-800', icon: Clock },
  ESCROW_FUNDED: { label: 'Payment Received', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  DISPUTED: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'client' | 'professional'>('client');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = activeTab === 'client' 
        ? '/api/v1/professionals/requests/client'
        : '/api/v1/professionals/requests/professional';
      
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (requestId: string, status: string, agreedPriceGhs?: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, agreedPriceGhs }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const submitReview = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewRating(5);
        setReviewComment('');
        fetchRequests();
      } else {
        alert(data.error?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptWithPrice = async () => {
    if (!selectedRequest || !agreedPrice) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED', agreedPriceGhs: parseFloat(agreedPrice) }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPriceModal(false);
        setSelectedRequest(null);
        setAgreedPrice('');
        fetchRequests();
      } else {
        alert(data.error?.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fundEscrow = async (requestId: string) => {
    // In a real app, this would integrate with a payment gateway
    // For now, we simulate payment with a mock reference
    const paymentReference = `PAY-${Date.now()}`;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${requestId}/fund-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentReference }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment successful! Funds are now in escrow.');
        fetchRequests();
      } else {
        alert(data.error?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Failed to fund escrow:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground">Manage your professional service requests</p>
        </div>
        <Link href="/professionals">
          <Button variant="primary">Find Professionals</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('client')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'client'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          My Requests
        </button>
        <button
          onClick={() => setActiveTab('professional')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'professional'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Requests for Me
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<MessageSquare className="h-6 w-6" />}
              title={activeTab === 'client' ? 'No requests yet' : 'No incoming requests'}
              description={
                activeTab === 'client'
                  ? 'Browse professionals and request their services.'
                  : 'Create a professional profile to receive service requests.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <Link href={`/dashboard/service-requests/${request.id}`} className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {activeTab === 'client'
                        ? request.professional.user.fullName
                        : request.client.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'client' ? request.professional.title : request.client.email}
                    </p>

                    {request.service && (
                      <p className="text-sm text-primary mt-1">
                        Service: {request.service.name}
                      </p>
                    )}

                    <p className="text-sm text-foreground mt-2 line-clamp-2">
                      {request.description}
                    </p>

                    {request.agreedPriceGhs && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-foreground">
                          Total: GHS {Number(request.agreedPriceGhs).toLocaleString()}
                        </p>
                        {request.platformFeeGhs && (
                          <p className="text-muted-foreground text-xs">
                            Platform fee: GHS {Number(request.platformFeeGhs).toLocaleString()} (10%)
                          </p>
                        )}
                        {activeTab === 'professional' && request.professionalNetGhs && (
                          <p className="text-green-600 text-xs">
                            You receive: GHS {Number(request.professionalNetGhs).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col gap-2">
                    {/* Client Actions */}
                    {activeTab === 'client' && (
                      <>
                        {request.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => updateStatus(request.id, 'CANCELLED')}
                          >
                            Cancel
                          </Button>
                        )}
                        {request.status === 'ACCEPTED' && request.agreedPriceGhs && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => fundEscrow(request.id)}
                          >
                            Pay GHS {Number(request.agreedPriceGhs).toLocaleString()}
                          </Button>
                        )}
                        {request.status === 'DELIVERED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateStatus(request.id, 'COMPLETED')}
                          >
                            Confirm & Release Payment
                          </Button>
                        )}
                        {request.status === 'COMPLETED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowReviewModal(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </>
                    )}

                    {/* Professional Actions */}
                    {activeTab === 'professional' && (
                      <>
                        {request.status === 'PENDING' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowPriceModal(true);
                              }}
                            >
                              Accept & Set Price
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateStatus(request.id, 'CANCELLED')}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        {request.status === 'ACCEPTED' && (
                          <p className="text-xs text-muted-foreground">Waiting for client payment</p>
                        )}
                        {request.status === 'ESCROW_FUNDED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateStatus(request.id, 'IN_PROGRESS')}
                          >
                            Start Work
                          </Button>
                        )}
                        {request.status === 'IN_PROGRESS' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateStatus(request.id, 'DELIVERED')}
                          >
                            Mark as Delivered
                          </Button>
                        )}
                        {request.status === 'DELIVERED' && (
                          <p className="text-xs text-muted-foreground">Waiting for client confirmation</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Leave a Review</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Comment (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={submitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal - Professional sets price when accepting */}
      {showPriceModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Set Your Price</h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Set the total price for this service. The platform will take a 10% commission.
            </p>

            {selectedRequest.service && (
              <p className="text-sm text-foreground mb-4">
                Service: <strong>{selectedRequest.service.name}</strong>
                <br />
                Listed price: GHS {Number(selectedRequest.service.priceGhs).toLocaleString()}
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Total Price (GHS)
              </label>
              <input
                type="number"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {agreedPrice && (
                <div className="mt-2 text-sm">
                  <p className="text-muted-foreground">
                    Platform fee (10%): GHS {(parseFloat(agreedPrice) * 0.1).toLocaleString()}
                  </p>
                  <p className="text-green-600 font-medium">
                    You receive: GHS {(parseFloat(agreedPrice) * 0.9).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedRequest(null);
                  setAgreedPrice('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={acceptWithPrice}
                disabled={isSubmitting || !agreedPrice}
              >
                {isSubmitting ? 'Accepting...' : 'Accept Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
