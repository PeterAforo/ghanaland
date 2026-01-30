'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Plus, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { API_BASE_URL } from '@/lib/api';

interface UserLand {
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
  currentStage: string;
  progress: number;
  totalStages: number;
  currentStageIndex: number;
  journeyStartedAt: string;
  journeyCompletedAt: string | null;
  createdAt: string;
  transaction: {
    listing: {
      id: string;
      title: string;
      media: { url: string; type: string }[];
    };
  } | null;
}

const STAGE_LABELS: Record<string, string> = {
  LAND_ACQUIRED: 'Land Acquired',
  LAND_SEARCH: 'Land Search',
  SURVEY_SITE_PLAN: 'Survey & Site Plan',
  INDENTURE_PREPARATION: 'Indenture Preparation',
  STAMP_DUTY: 'Stamp Duty',
  LAND_VALUATION: 'Land Valuation',
  TITLE_REGISTRATION: 'Title Registration',
  TITLE_CERTIFICATE: 'Title Certificate',
  ARCHITECTURAL_DESIGN: 'Architectural Design',
  STRUCTURAL_DESIGN: 'Structural Design',
  DEVELOPMENT_PERMIT: 'Development Permit',
  BUILDING_PERMIT_APPLICATION: 'Building Permit Application',
  SITE_INSPECTION: 'Site Inspection',
  TECHNICAL_REVIEW: 'Technical Review',
  BUILDING_PERMIT_ISSUED: 'Building Permit Issued',
  READY_TO_BUILD: 'Ready to Build',
};

interface UnlinkedTransaction {
  id: string;
  agreedPriceGhs: number;
  completedAt: string;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    town: string | null;
    sizeAcres: number;
    media: { url: string }[];
  };
  seller: {
    fullName: string;
    phone: string | null;
  };
}

export default function MyLandsPage() {
  const [lands, setLands] = useState<UserLand[]>([]);
  const [unlinkedTransactions, setUnlinkedTransactions] = useState<UnlinkedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLands();
    fetchUnlinkedTransactions();
  }, []);

  const fetchLands = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/my-lands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLands(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnlinkedTransactions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/unlinked-transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUnlinkedTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch unlinked transactions:', error);
    }
  };

  const addLandFromTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/from-transaction/${transactionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchLands();
        fetchUnlinkedTransactions();
      } else {
        alert(data.error?.message || 'Failed to add land');
      }
    } catch (error) {
      console.error('Failed to add land from transaction:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Lands</h1>
          <p className="text-muted-foreground">
            Track your land journey from purchase to building permit
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Land
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lands.length}</p>
                <p className="text-sm text-muted-foreground">Total Lands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lands.filter(l => l.progress < 50).length}
                </p>
                <p className="text-sm text-muted-foreground">In Early Stages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lands.filter(l => l.progress >= 50 && l.progress < 100).length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lands.filter(l => l.journeyCompletedAt).length}
                </p>
                <p className="text-sm text-muted-foreground">Ready to Build</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unlinked Transactions - Purchased lands not yet added */}
      {unlinkedTransactions.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Purchased Lands Not Yet Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You have {unlinkedTransactions.length} completed transaction(s) that haven't been added to your land journey yet.
            </p>
            <div className="space-y-3">
              {unlinkedTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {txn.listing.media?.[0]?.url ? (
                        <img
                          src={txn.listing.media[0].url}
                          alt={txn.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{txn.listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.listing.district}, {txn.listing.region} • GHS {Number(txn.agreedPriceGhs).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => addLandFromTransaction(txn.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to My Lands
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lands List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : lands.length === 0 && unlinkedTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No lands yet"
              description="Add your first land to start tracking your journey to building permit."
            />
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Land
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lands.map((land) => (
            <Link key={land.id} href={`/dashboard/my-lands/${land.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Land Image or Placeholder */}
                    <div className="w-full lg:w-32 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {land.transaction?.listing?.media?.[0]?.url ? (
                        <img
                          src={land.transaction.listing.media[0].url}
                          alt={land.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Land Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {land.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {land.locality}, {land.district}, {land.region}
                          </p>
                          {land.plotNumber && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Plot: {land.plotNumber}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Current Stage */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Current: <span className="font-medium text-foreground">{STAGE_LABELS[land.currentStage]}</span>
                          </span>
                          <span className="text-muted-foreground">{land.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(land.progress)} transition-all`}
                            style={{ width: `${land.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        {land.landSize && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {land.landSize} {land.landSizeUnit}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started {new Date(land.journeyStartedAt).toLocaleDateString()}
                        </span>
                        {land.journeyCompletedAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Land Modal */}
      {showAddModal && (
        <AddLandModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchLands();
          }}
        />
      )}
    </div>
  );
}

// Add Land Modal Component
function AddLandModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    region: '',
    district: '',
    locality: '',
    plotNumber: '',
    landSize: '',
    landSizeUnit: 'acres',
    gpsAddress: '',
    purchaseDate: '',
    purchasePrice: '',
    sellerName: '',
    sellerContact: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/land-journey/lands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          landSize: formData.landSize ? parseFloat(formData.landSize) : undefined,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error?.message || 'Failed to add land');
      }
    } catch (error) {
      console.error('Failed to add land:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regions = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Central',
    'Eastern',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Bono',
    'Bono East',
    'Ahafo',
    'Western North',
    'Oti',
    'North East',
    'Savannah',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Add New Land</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Add details about your land to start tracking your journey to building permit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., My Residential Plot at East Legon"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Region *
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Region</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                District *
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g., Accra Metropolitan"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Locality *
              </label>
              <input
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                placeholder="e.g., East Legon"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Plot Number
              </label>
              <input
                type="text"
                value={formData.plotNumber}
                onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                placeholder="e.g., Plot 45, Block B"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Land Size
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                  placeholder="0.5"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={formData.landSizeUnit}
                  onChange={(e) => setFormData({ ...formData, landSizeUnit: e.target.value })}
                  className="w-24 rounded-xl border border-border bg-background px-2 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="acres">Acres</option>
                  <option value="plots">Plots</option>
                  <option value="sqm">Sq.m</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                GPS Address
              </label>
              <input
                type="text"
                value={formData.gpsAddress}
                onChange={(e) => setFormData({ ...formData, gpsAddress: e.target.value })}
                placeholder="e.g., GA-123-4567"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Purchase Info */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Purchase Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Purchase Price (GHS)
                </label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="150000"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  placeholder="Seller's full name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seller Contact
                </label>
                <input
                  type="text"
                  value={formData.sellerContact}
                  onChange={(e) => setFormData({ ...formData, sellerContact: e.target.value })}
                  placeholder="+233244123456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Any additional notes about this land..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Land'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
