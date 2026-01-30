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
  AlertCircle,
  Download,
  User,
  MapPin,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { format } from 'date-fns';

interface PermitDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  verified: boolean;
  uploadedAt: string;
}

interface StatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  notes: string | null;
  createdAt: string;
}

interface PermitApplication {
  id: string;
  type: string;
  status: string;
  referenceNumber: string | null;
  propertyAddress: string;
  propertyRegion: string;
  propertyDistrict: string;
  plotNumber: string | null;
  landSize: number | null;
  landSizeUnit: string | null;
  projectDescription: string | null;
  buildingType: string | null;
  numberOfFloors: number | null;
  estimatedCost: number | null;
  applicationFee: number | null;
  feePaid: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  applicant: { id: string; fullName: string; email: string; phone: string };
  documents: PermitDocument[];
  statusHistory: StatusHistory[];
}

const PERMIT_TYPE_LABELS: Record<string, string> = {
  BUILDING_PERMIT: 'Building Permit',
  LAND_USE_PERMIT: 'Land Use Permit',
  DEVELOPMENT_PERMIT: 'Development Permit',
  SUBDIVISION_PERMIT: 'Subdivision Permit',
  OCCUPANCY_PERMIT: 'Occupancy Permit',
  DEMOLITION_PERMIT: 'Demolition Permit',
  RENOVATION_PERMIT: 'Renovation Permit',
};

const DOCUMENT_TYPES: Record<string, string> = {
  SITE_PLAN: 'Site Plan',
  ARCHITECTURAL_DRAWING: 'Architectural Drawing',
  STRUCTURAL_DRAWING: 'Structural Drawing',
  LAND_TITLE: 'Land Title',
  SURVEY_PLAN: 'Survey Plan',
  TAX_CLEARANCE: 'Tax Clearance',
  ENVIRONMENTAL_ASSESSMENT: 'Environmental Assessment',
  ID_DOCUMENT: 'ID Document',
  PROOF_OF_OWNERSHIP: 'Proof of Ownership',
  OTHER: 'Other',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ADDITIONAL_INFO_REQUIRED: { label: 'Additional Info Required', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function AdminPermitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<PermitApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]);

  const fetchApplication = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/permits/admin/application/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplication(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/permits/admin/application/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes || undefined,
          rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNotes('');
        setRejectionReason('');
        fetchApplication();
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const verifyDocument = async (documentId: string, verified: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/v1/permits/admin/documents/${documentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verified }),
      });
      fetchApplication();
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-foreground">Application not found</h1>
        <Link href="/admin/permits" className="text-primary hover:underline mt-4 block">
          Back to permits
        </Link>
      </div>
    );
  }

  const canUpdateStatus = !['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(application.status);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/permits"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to permits
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(application.status)}
            {application.referenceNumber && (
              <span className="text-sm text-muted-foreground font-mono">
                {application.referenceNumber}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {PERMIT_TYPE_LABELS[application.type] || application.type}
          </h1>
        </div>
        {canUpdateStatus && (
          <Button variant="primary" onClick={() => setShowStatusModal(true)}>
            Update Status
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{application.applicant.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{application.applicant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{application.applicant.phone || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{application.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">
                    {application.propertyDistrict}, {application.propertyRegion}
                  </p>
                </div>
                {application.plotNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Plot Number</p>
                    <p className="font-medium text-foreground">{application.plotNumber}</p>
                  </div>
                )}
                {application.landSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Land Size</p>
                    <p className="font-medium text-foreground">
                      {application.landSize} {application.landSizeUnit}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          {(application.projectDescription || application.buildingType) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.projectDescription && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-foreground">{application.projectDescription}</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  {application.buildingType && (
                    <div>
                      <p className="text-sm text-muted-foreground">Building Type</p>
                      <p className="font-medium text-foreground">{application.buildingType}</p>
                    </div>
                  )}
                  {application.numberOfFloors && (
                    <div>
                      <p className="text-sm text-muted-foreground">Floors</p>
                      <p className="font-medium text-foreground">{application.numberOfFloors}</p>
                    </div>
                  )}
                  {application.estimatedCost && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium text-foreground">
                        GHS {Number(application.estimatedCost).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({application.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {DOCUMENT_TYPES[doc.type] || doc.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                        <Button
                          variant={doc.verified ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => verifyDocument(doc.id, !doc.verified)}
                        >
                          {doc.verified ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verified
                            </>
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fee Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                GHS {Number(application.applicationFee || 0).toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${application.feePaid ? 'text-green-600' : 'text-red-600'}`}>
                {application.feePaid ? '✓ Paid' : '✗ Not Paid'}
              </p>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      {index < application.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-foreground text-sm">
                        {STATUS_CONFIG[history.toStatus]?.label || history.toStatus}
                      </p>
                      {history.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{history.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(history.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{format(new Date(application.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {application.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="text-foreground">{format(new Date(application.submittedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {application.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="text-green-600">{format(new Date(application.approvedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {application.rejectedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="text-red-600">{format(new Date(application.rejectedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {application.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="text-foreground">{format(new Date(application.expiresAt), 'MMM d, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Update Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select status</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ADDITIONAL_INFO_REQUIRED">Additional Info Required</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                />
              </div>

              {newStatus === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the application is being rejected..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus('');
                  setStatusNotes('');
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={updateStatus}
                disabled={isUpdating || !newStatus || (newStatus === 'REJECTED' && !rejectionReason)}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
