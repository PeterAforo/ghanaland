'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  Download,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { format } from 'date-fns';

interface ChecklistItem {
  document: string;
  label: string;
  uploaded: boolean;
}

interface Checklist {
  escrowFunded: boolean;
  inputDocuments: ChecklistItem[];
  outputDocuments: ChecklistItem[];
  professionalConfirmedDocumentsReceived: boolean;
  professionalConfirmedDeliverablesUploaded: boolean;
  clientConfirmedWorkAccepted: boolean;
  allInputDocsUploaded: boolean;
  allOutputDocsUploaded: boolean;
  readyForRelease: boolean;
}

interface ServiceRequestDetail {
  request: {
    id: string;
    description: string;
    status: string;
    agreedPriceGhs: number | null;
    platformFeeGhs: number | null;
    professionalNetGhs: number | null;
    paymentStatus: string;
    clientConfirmedWork: boolean;
    professionalConfirmedWork: boolean;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    client: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
    professional: {
      id: string;
      type: string;
      user: {
        id: string;
        fullName: string;
        email: string;
      };
    };
    service: {
      id: string;
      name: string;
    } | null;
    documents: {
      id: string;
      type: string;
      category: string;
      name: string;
      fileUrl: string;
      uploadedBy: {
        id: string;
        fullName: string;
      };
    }[];
    confirmations: {
      id: string;
      type: string;
      role: string;
      confirmed: boolean;
      confirmedAt: string | null;
      user: {
        id: string;
        fullName: string;
      };
    }[];
  };
  checklist: Checklist;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  ESCROW_FUNDED: { label: 'Escrow Funded', color: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  DISPUTED: { label: 'Disputed', color: 'bg-orange-100 text-orange-800' },
};

export default function AdminServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ServiceRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchRequestChecklist();
    }
  }, [params.id]);

  const fetchRequestChecklist = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${API_BASE_URL}/api/v1/professionals/admin/requests/${params.id}/checklist`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!confirm('Are you sure you want to release the escrow? This action cannot be undone.')) {
      return;
    }

    setIsReleasing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${API_BASE_URL}/api/v1/professionals/admin/requests/${params.id}/release-escrow`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: releaseNotes }),
        }
      );
      const result = await res.json();
      if (result.success) {
        alert('Escrow released successfully!');
        fetchRequestChecklist();
      } else {
        alert(result.error?.message || 'Failed to release escrow');
      }
    } catch (error) {
      console.error('Failed to release escrow:', error);
      alert('Failed to release escrow');
    } finally {
      setIsReleasing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Service request not found</p>
        <Link href="/admin/service-requests">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const { request, checklist } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/service-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {request.service?.name || 'Service Request'}
            </h1>
            <p className="text-muted-foreground">
              {request.professional.type} Service
            </p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{request.client.fullName}</p>
            <p className="text-sm text-muted-foreground">{request.client.email}</p>
            {request.client.phone && (
              <p className="text-sm text-muted-foreground">{request.client.phone}</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Professional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{request.professional.user.fullName}</p>
            <p className="text-sm text-muted-foreground">{request.professional.user.email}</p>
            <Badge variant="secondary" className="mt-2">
              {request.professional.type}
            </Badge>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.agreedPriceGhs ? (
              <>
                <p className="text-2xl font-bold">
                  GHS {Number(request.agreedPriceGhs).toLocaleString()}
                </p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>Platform Fee: GHS {Number(request.platformFeeGhs || 0).toLocaleString()}</p>
                  <p>Professional Net: GHS {Number(request.professionalNetGhs || 0).toLocaleString()}</p>
                </div>
                <Badge 
                  variant={request.paymentStatus === 'RELEASED' ? 'success' : 'secondary'}
                  className="mt-2"
                >
                  {request.paymentStatus}
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground">Price not set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Escrow Release Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Escrow Status */}
          <div className="flex items-center gap-3">
            {checklist.escrowFunded ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={checklist.escrowFunded ? 'text-green-700' : 'text-red-600'}>
              Escrow Funded
            </span>
          </div>

          {/* Input Documents */}
          <div>
            <h4 className="font-medium mb-2">Client Input Documents</h4>
            <div className="space-y-2 pl-4">
              {checklist.inputDocuments.map((doc) => (
                <div key={doc.document} className="flex items-center gap-3">
                  {doc.uploaded ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={doc.uploaded ? 'text-green-700' : 'text-red-600'}>
                    {doc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Output Documents */}
          <div>
            <h4 className="font-medium mb-2">Professional Deliverables</h4>
            <div className="space-y-2 pl-4">
              {checklist.outputDocuments.map((doc) => (
                <div key={doc.document} className="flex items-center gap-3">
                  {doc.uploaded ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={doc.uploaded ? 'text-green-700' : 'text-red-600'}>
                    {doc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmations */}
          <div>
            <h4 className="font-medium mb-2">Confirmations</h4>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3">
                {checklist.professionalConfirmedDocumentsReceived ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Professional confirmed documents received</span>
              </div>
              <div className="flex items-center gap-3">
                {checklist.professionalConfirmedDeliverablesUploaded ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Professional confirmed deliverables uploaded</span>
              </div>
              <div className="flex items-center gap-3">
                {checklist.clientConfirmedWorkAccepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Client confirmed work accepted</span>
              </div>
            </div>
          </div>

          {/* Release Action */}
          {request.status !== 'COMPLETED' && (
            <div className="border-t pt-6">
              {checklist.readyForRelease ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Ready for Escrow Release</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      All checklist items are complete. You can release the escrow.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Release Notes (optional)</label>
                    <textarea
                      value={releaseNotes}
                      onChange={(e) => setReleaseNotes(e.target.value)}
                      placeholder="Add any notes about this release..."
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleReleaseEscrow}
                    disabled={isReleasing}
                    className="w-full"
                  >
                    {isReleasing ? 'Releasing...' : 'Release Escrow to Professional'}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Not Ready for Release</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Complete all checklist items before releasing escrow.
                  </p>
                </div>
              )}
            </div>
          )}

          {request.status === 'COMPLETED' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Escrow Released</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Completed on {request.completedAt && format(new Date(request.completedAt), 'PPP')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents ({request.documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {request.documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {request.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} - {doc.category.replace(/_/g, ' ')} • 
                        Uploaded by {doc.uploadedBy.fullName}
                      </p>
                    </div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation History */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation History</CardTitle>
        </CardHeader>
        <CardContent>
          {request.confirmations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No confirmations yet</p>
          ) : (
            <div className="space-y-2">
              {request.confirmations.map((conf) => (
                <div
                  key={conf.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {conf.confirmed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {conf.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conf.role} - {conf.user.fullName}
                        {conf.confirmedAt && ` • ${format(new Date(conf.confirmedAt), 'PPp')}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
