'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';

const PERMIT_TYPES = [
  { value: 'BUILDING_PERMIT', label: 'Building Permit', description: 'For new construction projects', fee: 500 },
  { value: 'LAND_USE_PERMIT', label: 'Land Use Permit', description: 'For change of land use', fee: 300 },
  { value: 'DEVELOPMENT_PERMIT', label: 'Development Permit', description: 'For land development projects', fee: 750 },
  { value: 'SUBDIVISION_PERMIT', label: 'Subdivision Permit', description: 'For dividing land into plots', fee: 1000 },
  { value: 'OCCUPANCY_PERMIT', label: 'Occupancy Permit', description: 'For building occupancy approval', fee: 200 },
  { value: 'DEMOLITION_PERMIT', label: 'Demolition Permit', description: 'For demolishing structures', fee: 400 },
  { value: 'RENOVATION_PERMIT', label: 'Renovation Permit', description: 'For major renovations', fee: 350 },
];

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo',
  'Savannah', 'North East', 'Oti', 'Western North',
];

const BUILDING_TYPES = [
  'Residential - Single Family',
  'Residential - Multi Family',
  'Commercial - Office',
  'Commercial - Retail',
  'Industrial',
  'Mixed Use',
  'Institutional',
  'Religious',
  'Other',
];

export default function NewPermitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    propertyAddress: '',
    propertyRegion: '',
    propertyDistrict: '',
    plotNumber: '',
    landSize: '',
    landSizeUnit: 'acres',
    projectDescription: '',
    buildingType: '',
    numberOfFloors: '',
    estimatedCost: '',
  });

  const selectedPermitType = PERMIT_TYPES.find(p => p.value === formData.type);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/permits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          propertyAddress: formData.propertyAddress,
          propertyRegion: formData.propertyRegion,
          propertyDistrict: formData.propertyDistrict,
          plotNumber: formData.plotNumber || undefined,
          landSize: formData.landSize ? parseFloat(formData.landSize) : undefined,
          landSizeUnit: formData.landSizeUnit,
          projectDescription: formData.projectDescription || undefined,
          buildingType: formData.buildingType || undefined,
          numberOfFloors: formData.numberOfFloors ? parseInt(formData.numberOfFloors) : undefined,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/permits/${data.data.id}`);
      } else {
        alert(data.error?.message || 'Failed to create application');
      }
    } catch (error) {
      console.error('Failed to create application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/permits"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to permits
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Permit Application</h1>
        <p className="text-muted-foreground">Fill in the details to start your permit application</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Permit Type' : s === 2 ? 'Property Details' : 'Project Details'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Permit Type */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Permit Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {PERMIT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          Fee: GHS {type.fee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!formData.type}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Property Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  name="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={handleChange}
                  required
                  placeholder="Enter full property address"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Region *
                  </label>
                  <select
                    name="propertyRegion"
                    value={formData.propertyRegion}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    name="propertyDistrict"
                    value={formData.propertyDistrict}
                    onChange={handleChange}
                    required
                    placeholder="Enter district"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Plot Number
                  </label>
                  <input
                    type="text"
                    name="plotNumber"
                    value={formData.plotNumber}
                    onChange={handleChange}
                    placeholder="e.g., Plot 123"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Land Size
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="landSize"
                      value={formData.landSize}
                      onChange={handleChange}
                      placeholder="Size"
                      step="0.01"
                      min="0"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select
                      name="landSizeUnit"
                      value={formData.landSizeUnit}
                      onChange={handleChange}
                      className="w-28 rounded-xl border border-border bg-background px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="acres">Acres</option>
                      <option value="plots">Plots</option>
                      <option value="sqm">Sq. Meters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(3)}
                  disabled={!formData.propertyAddress || !formData.propertyRegion || !formData.propertyDistrict}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Project Details */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Description
                </label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  placeholder="Describe your project..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {['BUILDING_PERMIT', 'RENOVATION_PERMIT', 'OCCUPANCY_PERMIT'].includes(formData.type) && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Building Type
                      </label>
                      <select
                        name="buildingType"
                        value={formData.buildingType}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select type</option>
                        {BUILDING_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Number of Floors
                      </label>
                      <input
                        type="number"
                        name="numberOfFloors"
                        value={formData.numberOfFloors}
                        onChange={handleChange}
                        placeholder="e.g., 2"
                        min="1"
                        max="100"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Estimated Project Cost (GHS)
                    </label>
                    <input
                      type="number"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                      placeholder="e.g., 500000"
                      min="0"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 rounded-xl bg-muted">
                <h4 className="font-medium text-foreground mb-2">Application Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {selectedPermitType?.label}</p>
                  <p><strong>Property:</strong> {formData.propertyAddress}</p>
                  <p><strong>Location:</strong> {formData.propertyDistrict}, {formData.propertyRegion}</p>
                  <p><strong>Application Fee:</strong> GHS {selectedPermitType?.fee.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
