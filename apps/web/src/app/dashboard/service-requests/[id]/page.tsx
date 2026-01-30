'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Trash2,
  Eye,
  Send,
  Shield,
  X,
} from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';

interface ServiceRequest {
  id: string;
  description: string;
  status: string;
  agreedPriceGhs: number | null;
  platformFeeGhs: number | null;
  professionalNetGhs: number | null;
  paymentStatus: string;
  clientConfirmedWork: boolean;
  professionalConfirmedWork: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  professional: {
    id: string;
    type: string;
    title: string;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
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
  landJourneyStage?: {
    id: string;
    stage: string;
    land: {
      id: string;
      title: string;
    };
  };
}

interface Document {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isRequired: boolean;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface Confirmation {
  id: string;
  role: string;
  type: string;
  confirmed: boolean;
  notes: string | null;
  confirmedAt: string | null;
  user: {
    id: string;
    fullName: string;
  };
}

interface RequiredDocs {
  input: string[];
  output: string[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  ESCROW_FUNDED: { label: 'Escrow Funded', color: 'bg-purple-100 text-purple-800', icon: Shield },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-800', icon: Send },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  DISPUTED: { label: 'Disputed', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

const DOCUMENT_CATEGORIES: Record<string, string> = {
  LAND_TITLE: 'Land Title',
  SITE_PLAN: 'Site Plan',
  INDENTURE: 'Indenture',
  ID_DOCUMENT: 'ID Document',
  PROOF_OF_OWNERSHIP: 'Proof of Ownership',
  SURVEY_REPORT: 'Survey Report',
  VALUATION_REPORT: 'Valuation Report',
  ARCHITECTURAL_DRAWING: 'Architectural Drawing',
  BUILDING_PERMIT: 'Building Permit',
  OTHER_INPUT: 'Other Document',
  SURVEY_PLAN: 'Survey Plan',
  LEGAL_OPINION: 'Legal Opinion',
  DRAFT_INDENTURE: 'Draft Indenture',
  FINAL_INDENTURE: 'Final Indenture',
  ARCHITECTURAL_DESIGN: 'Architectural Design',
  STRUCTURAL_DESIGN: 'Structural Design',
  VALUATION_CERTIFICATE: 'Valuation Certificate',
  PERMIT_APPLICATION: 'Permit Application',
  INSPECTION_REPORT: 'Inspection Report',
  OTHER_DELIVERABLE: 'Other Deliverable',
};

const CONFIRMATION_TYPES: Record<string, { label: string; description: string }> = {
  DOCUMENTS_RECEIVED: { label: 'Documents Received', description: 'Confirm all required documents have been received' },
  WORK_STARTED: { label: 'Work Started', description: 'Confirm work has begun on this request' },
  DELIVERABLES_UPLOADED: { label: 'Deliverables Uploaded', description: 'Confirm all deliverables have been uploaded' },
  WORK_ACCEPTED: { label: 'Work Accepted', description: 'Confirm the delivered work is satisfactory' },
  PAYMENT_RELEASED: { label: 'Release Payment', description: 'Confirm escrow funds can be released' },
};

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [documents, setDocuments] = useState<{
    all: Document[];
    inputDocuments: Document[];
    deliverables: Document[];
    referenceDocuments: Document[];
    contracts: Document[];
  } | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'INPUT' | 'DELIVERABLE'>('INPUT');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Confirmation state
  const [confirmingType, setConfirmingType] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (params.id && currentUserId) {
      fetchRequest();
      fetchDocuments();
      fetchConfirmations();
    }
  }, [params.id, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUserId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchRequest = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequest(data.data);
        setIsProfessional(data.data.professional.user.id === currentUserId);
        setIsClient(data.data.client.id === currentUserId);
        
        // Fetch required documents for this professional type
        fetchRequiredDocs(data.data.professional.type);
      }
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${params.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchConfirmations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${params.id}/confirmations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConfirmations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch confirmations:', error);
    }
  };

  const fetchRequiredDocs = async (professionalType: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/required-documents/${professionalType}`);
      const data = await res.json();
      if (data.success) {
        setRequiredDocs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch required docs:', error);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadCategory || !uploadName || !uploadedFileUrl) {
      setUploadError('Please fill in all required fields and upload a file');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${params.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: uploadType,
          category: uploadCategory,
          name: uploadName,
          description: uploadDescription,
          fileUrl: uploadedFileUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        resetUploadForm();
        fetchDocuments();
      } else {
        setUploadError(data.error?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      setUploadError('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadCategory('');
    setUploadName('');
    setUploadDescription('');
    setUploadedFileUrl('');
    setUploadedFileName('');
    setUploadError('');
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
      } else {
        alert(data.error?.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleConfirm = async (type: string) => {
    setConfirmingType(type);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/${params.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, notes: confirmNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmNotes('');
        fetchRequest();
        fetchConfirmations();
      } else {
        alert(data.error?.message || 'Failed to confirm');
      }
    } catch (error) {
      console.error('Failed to confirm:', error);
    } finally {
      setConfirmingType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const isConfirmed = (type: string, role?: string) => {
    return confirmations.some(c => c.type === type && c.confirmed && (!role || c.role === role));
  };

  const canConfirm = (type: string): boolean => {
    if (!request) return false;

    switch (type) {
      case 'DOCUMENTS_RECEIVED':
        return isProfessional && ['ESCROW_FUNDED', 'IN_PROGRESS'].includes(request.status);
      case 'WORK_STARTED':
        return isProfessional && request.status === 'ESCROW_FUNDED';
      case 'DELIVERABLES_UPLOADED':
        return isProfessional && request.status === 'IN_PROGRESS' && (documents?.deliverables?.length || 0) > 0;
      case 'WORK_ACCEPTED':
        return isClient && request.status === 'DELIVERED';
      case 'PAYMENT_RELEASED':
        return request.status === 'DELIVERED';
      default:
        return false;
    }
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

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Service request not found</p>
        <Link href="/dashboard/service-requests">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/service-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {request.service?.name || 'Service Request'}
            </h1>
            <p className="text-muted-foreground">
              {isProfessional ? `From ${request.client.fullName}` : `With ${request.professional.user.fullName}`}
            </p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Request Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1 text-foreground">{request.description}</p>
            </div>

            {request.listing && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Related Property</label>
                <p className="mt-1 text-foreground">{request.listing.title}</p>
              </div>
            )}

            {request.landJourneyStage && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <label className="text-sm font-medium text-primary">Linked to Land Journey</label>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{request.landJourneyStage.land.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Stage: {request.landJourneyStage.stage.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Link href={`/dashboard/my-lands/${request.landJourneyStage.land.id}`}>
                    <Button variant="outline" size="sm">
                      View Journey
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1 text-foreground">
                  {format(new Date(request.createdAt), 'PPP')}
                </p>
              </div>
              {request.startedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Started</label>
                  <p className="mt-1 text-foreground">
                    {format(new Date(request.startedAt), 'PPP')}
                  </p>
                </div>
              )}
              {request.completedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Completed</label>
                  <p className="mt-1 text-foreground">
                    {format(new Date(request.completedAt), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.agreedPriceGhs ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agreed Price</span>
                  <span className="font-semibold">GHS {Number(request.agreedPriceGhs).toLocaleString()}</span>
                </div>
                {isProfessional && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee (10%)</span>
                      <span>- GHS {Number(request.platformFeeGhs).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Your Earnings</span>
                      <span className="font-semibold text-green-600">
                        GHS {Number(request.professionalNetGhs).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${request.paymentStatus === 'ESCROW_FUNDED' ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm">
                      {request.paymentStatus === 'ESCROW_FUNDED' && 'Funds in Escrow'}
                      {request.paymentStatus === 'RELEASED' && 'Payment Released'}
                      {request.paymentStatus === 'UNPAID' && 'Awaiting Payment'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Price not yet agreed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1: Request Accepted */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                request.status !== 'PENDING' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Request Accepted & Price Agreed</p>
                <p className="text-sm text-muted-foreground">Professional accepts and sets the price</p>
              </div>
            </div>

            {/* Step 2: Escrow Funded */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ['ESCROW_FUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'].includes(request.status) 
                  ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Escrow Funded</p>
                <p className="text-sm text-muted-foreground">Client pays into escrow</p>
              </div>
            </div>

            {/* Step 3: Client Uploads Documents */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                (documents?.inputDocuments?.length || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Client Uploads Required Documents</p>
                <p className="text-sm text-muted-foreground">
                  {(documents?.inputDocuments?.length || 0)} document(s) uploaded
                </p>
                {isClient && ['ESCROW_FUNDED', 'IN_PROGRESS'].includes(request.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setUploadType('INPUT');
                      setShowUploadModal(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            </div>

            {/* Step 4: Work In Progress */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ['IN_PROGRESS', 'DELIVERED', 'COMPLETED'].includes(request.status) 
                  ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Work In Progress</p>
                <p className="text-sm text-muted-foreground">Professional works on the request</p>
                {canConfirm('WORK_STARTED') && !isConfirmed('WORK_STARTED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleConfirm('WORK_STARTED')}
                    disabled={confirmingType === 'WORK_STARTED'}
                  >
                    {confirmingType === 'WORK_STARTED' ? 'Confirming...' : 'Start Work'}
                  </Button>
                )}
              </div>
            </div>

            {/* Step 5: Professional Uploads Deliverables */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                (documents?.deliverables?.length || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Professional Uploads Deliverables</p>
                <p className="text-sm text-muted-foreground">
                  {(documents?.deliverables?.length || 0)} deliverable(s) uploaded
                </p>
                {isProfessional && request.status === 'IN_PROGRESS' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setUploadType('DELIVERABLE');
                      setShowUploadModal(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Deliverable
                  </Button>
                )}
              </div>
            </div>

            {/* Step 6: Work Delivered */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ['DELIVERED', 'COMPLETED'].includes(request.status) 
                  ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Send className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Work Delivered</p>
                <p className="text-sm text-muted-foreground">Professional marks work as delivered</p>
                {canConfirm('DELIVERABLES_UPLOADED') && !isConfirmed('DELIVERABLES_UPLOADED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleConfirm('DELIVERABLES_UPLOADED')}
                    disabled={confirmingType === 'DELIVERABLES_UPLOADED'}
                  >
                    {confirmingType === 'DELIVERABLES_UPLOADED' ? 'Confirming...' : 'Mark as Delivered'}
                  </Button>
                )}
              </div>
            </div>

            {/* Step 7: Client Accepts Work */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                request.clientConfirmedWork ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Client Accepts Work</p>
                <p className="text-sm text-muted-foreground">Client confirms work is satisfactory</p>
                {canConfirm('WORK_ACCEPTED') && !isConfirmed('WORK_ACCEPTED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleConfirm('WORK_ACCEPTED')}
                    disabled={confirmingType === 'WORK_ACCEPTED'}
                  >
                    {confirmingType === 'WORK_ACCEPTED' ? 'Confirming...' : 'Accept Work'}
                  </Button>
                )}
              </div>
            </div>

            {/* Step 8: Payment Released (Admin Controlled) */}
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                request.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Payment Released</p>
                <p className="text-sm text-muted-foreground">
                  Admin verifies checklist and releases escrow to professional
                </p>
                {request.status === 'COMPLETED' ? (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Escrow released - Payment sent to professional
                  </p>
                ) : request.clientConfirmedWork ? (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Pending Admin Review</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Admin will verify all documents and release payment within 1-2 business days.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Waiting for client to accept work
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Input Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Client Documents</span>
              {isClient && ['ESCROW_FUNDED', 'IN_PROGRESS'].includes(request.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadType('INPUT');
                    setShowUploadModal(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requiredDocs && requiredDocs.input.length > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Required Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {requiredDocs.input.map((doc) => {
                    const isUploaded = documents?.inputDocuments?.some(d => d.category === doc);
                    return (
                      <span
                        key={doc}
                        className={`text-xs px-2 py-1 rounded ${
                          isUploaded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {isUploaded ? '✓' : '○'} {DOCUMENT_CATEGORIES[doc] || doc}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {documents?.inputDocuments && documents.inputDocuments.length > 0 ? (
              <div className="space-y-3">
                {documents.inputDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOCUMENT_CATEGORIES[doc.category] || doc.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                      {doc.uploadedBy.id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Deliverables</span>
              {isProfessional && request.status === 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadType('DELIVERABLE');
                    setShowUploadModal(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requiredDocs && requiredDocs.output.length > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Expected Deliverables:</p>
                <div className="flex flex-wrap gap-2">
                  {requiredDocs.output.map((doc) => {
                    const isUploaded = documents?.deliverables?.some(d => d.category === doc);
                    return (
                      <span
                        key={doc}
                        className={`text-xs px-2 py-1 rounded ${
                          isUploaded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {isUploaded ? '✓' : '○'} {DOCUMENT_CATEGORIES[doc] || doc}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {documents?.deliverables && documents.deliverables.length > 0 ? (
              <div className="space-y-3">
                {documents.deliverables.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOCUMENT_CATEGORIES[doc.category] || doc.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      {doc.uploadedBy.id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No deliverables uploaded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Upload {uploadType === 'INPUT' ? 'Document' : 'Deliverable'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="">Select category</option>
                  {uploadType === 'INPUT' ? (
                    <>
                      <option value="LAND_TITLE">Land Title</option>
                      <option value="SITE_PLAN">Site Plan</option>
                      <option value="INDENTURE">Indenture</option>
                      <option value="ID_DOCUMENT">ID Document</option>
                      <option value="PROOF_OF_OWNERSHIP">Proof of Ownership</option>
                      <option value="SURVEY_REPORT">Survey Report</option>
                      <option value="VALUATION_REPORT">Valuation Report</option>
                      <option value="ARCHITECTURAL_DRAWING">Architectural Drawing</option>
                      <option value="BUILDING_PERMIT">Building Permit</option>
                      <option value="OTHER_INPUT">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="SURVEY_PLAN">Survey Plan</option>
                      <option value="LEGAL_OPINION">Legal Opinion</option>
                      <option value="DRAFT_INDENTURE">Draft Indenture</option>
                      <option value="FINAL_INDENTURE">Final Indenture</option>
                      <option value="ARCHITECTURAL_DESIGN">Architectural Design</option>
                      <option value="STRUCTURAL_DESIGN">Structural Design</option>
                      <option value="VALUATION_CERTIFICATE">Valuation Certificate</option>
                      <option value="PERMIT_APPLICATION">Permit Application</option>
                      <option value="INSPECTION_REPORT">Inspection Report</option>
                      <option value="OTHER_DELIVERABLE">Other</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Document Name *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g., Land Title Certificate"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Upload File *</label>
                <FileUpload
                  onUploadComplete={(result) => {
                    setUploadedFileUrl(result.url);
                    setUploadedFileName(result.fileName);
                    if (!uploadName) {
                      setUploadName(result.fileName.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  onError={(error) => setUploadError(error)}
                  folder={uploadType === 'INPUT' ? 'client-documents' : 'deliverables'}
                  label="Select File"
                  description="PDF, DOC, DOCX, JPG, PNG (max 10MB)"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadedFileUrl && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ File uploaded: {uploadedFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Add any notes about this document..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
            </div>

            {uploadError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {uploadError}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleUploadDocument}
                disabled={isUploading || !uploadedFileUrl}
              >
                {isUploading ? 'Saving...' : 'Save Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
