'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';

interface JourneyStage {
  stage: string;
  index: number;
  name: string;
  description: string;
  professionalType?: string;
  requiredDocuments: string[];
  outputDocuments: string[];
  estimatedDays: number;
  estimatedCostGhs?: { min: number; max: number };
  status: string;
  isCurrentStage: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  record?: {
    id: string;
    notes: string | null;
    completedAt: string | null;
    serviceRequest?: {
      id: string;
      status: string;
      professional: {
        user: { fullName: string };
      };
    };
  };
  documents: {
    id: string;
    name: string;
    documentType: string;
    fileUrl: string;
    uploadedAt: string;
    isVerified: boolean;
  }[];
}

interface LandDetail {
  id: string;
  title: string;
  description: string | null;
  region: string;
  district: string;
  locality: string;
  plotNumber: string | null;
  landSize: number | null;
  landSizeUnit: string | null;
  gpsAddress: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  sellerName: string | null;
  currentStage: string;
  progress: number;
  totalStages: number;
  currentStageIndex: number;
  journey: JourneyStage[];
}

const STATUS_ICONS: Record<string, any> = {
  NOT_STARTED: Clock,
  IN_PROGRESS: AlertCircle,
  PENDING_PROFESSIONAL: Users,
  PENDING_DOCUMENTS: FileText,
  PENDING_APPROVAL: Clock,
  COMPLETED: CheckCircle,
  SKIPPED: CheckCircle,
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'text-gray-400',
  IN_PROGRESS: 'text-blue-500',
  PENDING_PROFESSIONAL: 'text-purple-500',
  PENDING_DOCUMENTS: 'text-yellow-500',
  PENDING_APPROVAL: 'text-orange-500',
  COMPLETED: 'text-green-500',
  SKIPPED: 'text-gray-400',
};

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  SURVEYOR: 'Surveyor',
  ARCHITECT: 'Architect',
  LAWYER: 'Lawyer',
  ENGINEER: 'Engineer',
  VALUER: 'Valuer',
  PLANNER: 'Town Planner',
  AGENT: 'Real Estate Agent',
};

export default function LandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [land, setLand] = useState<LandDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (params.id) {
      fetchLandDetail();
    }
  }, [params.id]);

  const fetchLandDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/lands/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLand(data.data);
        // Auto-expand current stage
        const currentIdx = data.data.journey.findIndex((s: JourneyStage) => s.isCurrentStage);
        if (currentIdx >= 0) {
          setExpandedStages(new Set([currentIdx]));
        }
      }
    } catch (error) {
      console.error('Failed to fetch land:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStage = (index: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStages(newExpanded);
  };

  const markStageComplete = async (stage: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/lands/${params.id}/stages/${stage}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLandDetail();
      } else {
        alert(data.error?.message || 'Failed to update stage');
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const startStage = async (stage: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/lands/${params.id}/stages/${stage}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLandDetail();
      } else {
        alert(data.error?.message || 'Failed to start stage');
      }
    } catch (error) {
      console.error('Failed to start stage:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Land not found</p>
        <Link href="/dashboard/my-lands">
          <Button variant="secondary" className="mt-4">
            Back to My Lands
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/my-lands">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{land.title}</h1>
          <p className="text-muted-foreground">
            {land.locality}, {land.district}, {land.region}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Journey Progress</span>
                <span className="text-sm text-muted-foreground">{land.progress}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${land.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Stage {land.currentStageIndex + 1} of {land.totalStages}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {land.plotNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Plot</p>
                  <p className="font-medium">{land.plotNumber}</p>
                </div>
              )}
              {land.landSize && (
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium">{land.landSize} {land.landSizeUnit}</p>
                </div>
              )}
              {land.gpsAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">GPS</p>
                  <p className="font-medium">{land.gpsAddress}</p>
                </div>
              )}
              {land.purchasePrice && (
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Price</p>
                  <p className="font-medium">GHS {Number(land.purchasePrice).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Timeline */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Your Journey to Building Permit</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Follow these steps to obtain all necessary documents and permits for your land.
        </p>

        <div className="space-y-3">
          {land.journey.map((stage, index) => {
            const isExpanded = expandedStages.has(index);
            const StatusIcon = STATUS_ICONS[stage.status] || Clock;
            const statusColor = STATUS_COLORS[stage.status] || 'text-gray-400';

            return (
              <Card
                key={stage.stage}
                className={`transition-all ${
                  stage.isCurrentStage ? 'ring-2 ring-primary' : ''
                } ${stage.isLocked ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-0">
                  {/* Stage Header */}
                  <button
                    onClick={() => toggleStage(index)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                    disabled={stage.isLocked}
                  >
                    {/* Stage Number & Status */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      stage.isCompleted ? 'bg-green-100' : stage.isCurrentStage ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {stage.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className={`text-sm font-bold ${stage.isCurrentStage ? 'text-primary' : 'text-muted-foreground'}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{stage.name}</h3>
                        {stage.isCurrentStage && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{stage.description}</p>
                    </div>

                    {/* Status & Expand */}
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      {!stage.isLocked && (
                        isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && !stage.isLocked && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      {/* Stage Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {stage.professionalType && (
                          <div>
                            <p className="text-muted-foreground">Professional Needed</p>
                            <p className="font-medium">{PROFESSIONAL_TYPE_LABELS[stage.professionalType]}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Estimated Duration</p>
                          <p className="font-medium">{stage.estimatedDays} days</p>
                        </div>
                        {stage.estimatedCostGhs && (
                          <div>
                            <p className="text-muted-foreground">Estimated Cost</p>
                            <p className="font-medium">
                              GHS {stage.estimatedCostGhs.min.toLocaleString()} - {stage.estimatedCostGhs.max.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Required Documents */}
                      {stage.requiredDocuments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Required Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {stage.requiredDocuments.map((doc) => (
                              <span
                                key={doc}
                                className="px-2 py-1 text-xs bg-muted rounded-lg text-muted-foreground"
                              >
                                {doc.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Output Documents */}
                      {stage.outputDocuments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Documents You'll Receive</p>
                          <div className="flex flex-wrap gap-2">
                            {stage.outputDocuments.map((doc) => (
                              <span
                                key={doc}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg"
                              >
                                {doc.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Uploaded Documents */}
                      {stage.documents.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Uploaded Documents</p>
                          <div className="space-y-2">
                            {stage.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-muted rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{doc.name}</span>
                                  {doc.isVerified && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Service Request Status */}
                      {stage.record?.serviceRequest && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-purple-900">Professional Engaged</p>
                          <p className="text-sm text-purple-700">
                            {stage.record.serviceRequest.professional.user.fullName}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Status: {stage.record.serviceRequest.status.replace(/_/g, ' ')}
                          </p>
                          <Link href="/dashboard/service-requests">
                            <Button variant="secondary" size="sm" className="mt-2">
                              View Request
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {stage.professionalType && !stage.record?.serviceRequest && !stage.isCompleted && (
                          <Link href={`/professionals?type=${stage.professionalType}&landId=${land.id}&stage=${stage.stage}`}>
                            <Button variant="primary" size="sm">
                              <Users className="h-4 w-4 mr-1" />
                              Find {PROFESSIONAL_TYPE_LABELS[stage.professionalType]}
                            </Button>
                          </Link>
                        )}
                        {!stage.isCompleted && !stage.isLocked && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => markStageComplete(stage.stage)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark as Complete
                          </Button>
                        )}
                        {!stage.isCompleted && !stage.isLocked && stage.status === 'NOT_STARTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startStage(stage.stage)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Start This Step
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
