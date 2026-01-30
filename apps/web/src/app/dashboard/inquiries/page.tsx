'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { formatDate } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface Inquiry {
  id: string;
  message: string;
  status: string;
  readAt?: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    media?: Array<{ url: string }>;
  };
  sender: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export default function InquiriesPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchInquiries();
    if (activeTab === 'received') {
      fetchUnreadCount();
    }
  }, [page, activeTab]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = activeTab === 'received' ? 'received' : 'sent';
      const res = await fetch(`${API_BASE_URL}/api/v1/inquiries/${endpoint}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setInquiries(data.data);
        setPagination(data.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/inquiries/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (inquiryId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/v1/inquiries/${inquiryId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state
      setInquiries(prev => prev.map(inq => 
        inq.id === inquiryId ? { ...inq, status: 'READ', readAt: new Date().toISOString() } : inq
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
          <p className="text-muted-foreground">
            Manage messages from potential buyers
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="pending" className="text-sm">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => { setActiveTab('received'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          Received
          {unreadCount > 0 && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('sent'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Sent
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title={activeTab === 'received' ? 'No inquiries received' : 'No inquiries sent'}
          description={
            activeTab === 'received'
              ? 'When buyers contact you about your listings, their messages will appear here'
              : 'When you contact sellers about listings, your messages will appear here'
          }
          action={
            activeTab === 'sent' ? (
              <Link href="/listings">
                <Button variant="primary">Browse Listings</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              type={activeTab}
              onMarkAsRead={markAsRead}
            />
          ))}

          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InquiryCard({
  inquiry,
  type,
  onMarkAsRead,
}: {
  inquiry: Inquiry;
  type: 'received' | 'sent';
  onMarkAsRead: (id: string) => void;
}) {
  const isUnread = inquiry.status === 'PENDING' && type === 'received';
  const imageUrl = inquiry.listing?.media?.[0]?.url;

  return (
    <Card className={isUnread ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Listing Image */}
          <Link href={`/listings/${inquiry.listing.id}`} className="flex-shrink-0">
            <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt={inquiry.listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary/40" />
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link 
                  href={`/listings/${inquiry.listing.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {inquiry.listing.title}
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDate(inquiry.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isUnread && (
                  <Badge variant="pending" className="text-xs">New</Badge>
                )}
                {inquiry.status === 'READ' && type === 'received' && (
                  <Badge variant="neutral" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Read
                  </Badge>
                )}
              </div>
            </div>

            {/* Sender/Seller info */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {inquiry.sender.fullName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {type === 'received' ? inquiry.sender.fullName : 'You'}
              </span>
            </div>

            {/* Message */}
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {inquiry.message}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {type === 'received' && (
                <>
                  {inquiry.sender.phone && (
                    <a
                      href={`tel:${inquiry.sender.phone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </a>
                  )}
                  {inquiry.sender.phone && (
                    <a
                      href={`https://wa.me/${inquiry.sender.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={`mailto:${inquiry.sender.email}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                  {isUnread && (
                    <button
                      onClick={() => onMarkAsRead(inquiry.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      Mark as Read
                    </button>
                  )}
                </>
              )}
              <Link
                href={`/listings/${inquiry.listing.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors ml-auto"
              >
                <ExternalLink className="h-3 w-3" />
                View Listing
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
