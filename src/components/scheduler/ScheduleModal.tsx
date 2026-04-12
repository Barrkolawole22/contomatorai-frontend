'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { schedulerAPI, sitesAPI } from '@/lib/api';
import type { ScheduledPost, WordPressSite } from '@/types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingSchedule?: ScheduledPost | null;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  existingSchedule
}: ScheduleModalProps) {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [autoPublish, setAutoPublish] = useState(true);
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSites();
      initializeForm();
    }
  }, [isOpen, existingSchedule]);

  const loadSites = async () => {
    try {
      setLoadingSites(true);
      const response = await sitesAPI.getUserSites();
      if (response.data.success) {
        const sitesData = response.data.data || [];
        setSites(sitesData);
        
        // Auto-select site if not editing
        if (!existingSchedule && sitesData.length > 0) {
          setSelectedSite(sitesData[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading sites:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  const initializeForm = () => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);

    if (existingSchedule) {
      // Editing existing schedule
      setSelectedSite(existingSchedule.siteId);
      const scheduledDateTime = new Date(existingSchedule.scheduledFor);
      setScheduledDate(scheduledDateTime.toISOString().split('T')[0]);
      setScheduledTime(scheduledDateTime.toTimeString().slice(0, 5));
      setAutoPublish(existingSchedule.autoPublish ?? true);
      setNotifyOnPublish(existingSchedule.notifyOnPublish ?? true);
    } else {
      // New schedule - set default to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      setScheduledTime('09:00');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedSite) {
      setError('Please select a WordPress site');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError('Please select date and time');
      return;
    }

    // Combine date and time
    const scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledDateTime = new Date(scheduledFor);

    // Check if date is in the past
    if (scheduledDateTime < new Date()) {
      setError('Scheduled time must be in the future');
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (existingSchedule) {
        // Update existing schedule
        response = await schedulerAPI.updateSchedule(existingSchedule.id, {
          siteId: selectedSite,
          scheduledFor: scheduledDateTime.toISOString(),
          timezone,
          autoPublish,
          notifyOnPublish
        } as any);
      } else {
        // Create new schedule (you'll need to handle content selection differently)
        // This is a placeholder - adjust based on your actual API
        setError('Please use the schedule button on a specific article to create a schedule');
        setLoading(false);
        return;
      }

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to save schedule');
      }
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSite('');
    setScheduledDate('');
    setScheduledTime('');
    setAutoPublish(true);
    setNotifyOnPublish(true);
    setError(null);
    setSuccess(false);
  };

  const formatDateForDisplay = () => {
    if (!scheduledDate || !scheduledTime) return '';
    const date = new Date(`${scheduledDate}T${scheduledTime}`);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-50">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {existingSchedule ? 'Edit Schedule' : 'Schedule Post'}
              </h3>
              {existingSchedule && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {existingSchedule.content?.title || 'Untitled Post'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Schedule {existingSchedule ? 'Updated' : 'Created'} Successfully!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your post will be published automatically at the scheduled time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadingSites ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Site Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  WordPress Site
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!existingSchedule}
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} - {site.url}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>

              {/* Scheduled Time Display */}
              {scheduledDate && scheduledTime && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Will publish on:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {formatDateForDisplay()}
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Automatically publish at scheduled time
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifyOnPublish}
                    onChange={(e) => setNotifyOnPublish(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Send email notification when published
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      {existingSchedule ? 'Updating...' : 'Scheduling...'}
                    </span>
                  ) : success ? (
                    existingSchedule ? 'Updated!' : 'Scheduled!'
                  ) : (
                    existingSchedule ? 'Update Schedule' : 'Schedule Post'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}