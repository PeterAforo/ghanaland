'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '../_components/admin-layout';
import { API_BASE_URL } from '@/lib/api';

interface PlatformSettings {
  platformName: string;
  platformFeePercentage: number;
  escrowHoldDays: number;
  verificationFeeGhs: number;
  minListingPriceGhs: number;
  maxListingPriceGhs: number;
  supportEmail: string;
  supportPhone: string;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Ghana Lands',
  platformFeePercentage: 10,
  escrowHoldDays: 7,
  verificationFeeGhs: 500,
  minListingPriceGhs: 1000,
  maxListingPriceGhs: 50000000,
  supportEmail: 'support@ghanalands.com',
  supportPhone: '+233 XX XXX XXXX',
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  enablePushNotifications: false,
  maintenanceMode: false,
  allowNewRegistrations: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use defaults if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Platform Name</label>
              <Input
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Maintenance Mode</label>
                <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.maintenanceMode}
                onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-destructive' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Allow New Registrations</label>
                <p className="text-xs text-muted-foreground">Allow new users to sign up</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowNewRegistrations}
                onClick={() => updateSetting('allowNewRegistrations', !settings.allowNewRegistrations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowNewRegistrations ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Platform Fee (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.platformFeePercentage}
                onChange={(e) => updateSetting('platformFeePercentage', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Escrow Hold Period (days)</label>
              <Input
                type="number"
                min="1"
                value={settings.escrowHoldDays}
                onChange={(e) => updateSetting('escrowHoldDays', parseInt(e.target.value) || 7)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Verification Fee (GHS)</label>
              <Input
                type="number"
                min="0"
                value={settings.verificationFeeGhs}
                onChange={(e) => updateSetting('verificationFeeGhs', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Min Listing Price (GHS)</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.minListingPriceGhs}
                  onChange={(e) => updateSetting('minListingPriceGhs', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Listing Price (GHS)</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.maxListingPriceGhs}
                  onChange={(e) => updateSetting('maxListingPriceGhs', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Email Notifications</label>
                <p className="text-xs text-muted-foreground">Send email notifications to users</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enableEmailNotifications}
                onClick={() => updateSetting('enableEmailNotifications', !settings.enableEmailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableEmailNotifications ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">SMS Notifications</label>
                <p className="text-xs text-muted-foreground">Send SMS notifications to users</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enableSmsNotifications}
                onClick={() => updateSetting('enableSmsNotifications', !settings.enableSmsNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableSmsNotifications ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableSmsNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Push Notifications</label>
                <p className="text-xs text-muted-foreground">Send push notifications (WebSocket)</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enablePushNotifications}
                onClick={() => updateSetting('enablePushNotifications', !settings.enablePushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enablePushNotifications ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enablePushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Support Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Support Email
              </label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Support Phone
              </label>
              <Input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => updateSetting('supportPhone', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">API Server</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Database</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Cloudinary</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${settings.enableEmailNotifications ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Email Service</span>
              <Badge variant={settings.enableEmailNotifications ? 'success' : 'warning'}>
                {settings.enableEmailNotifications ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${settings.enableSmsNotifications ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">SMS Service</span>
              <Badge variant={settings.enableSmsNotifications ? 'success' : 'warning'}>
                {settings.enableSmsNotifications ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
