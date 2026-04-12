'use client';

import { CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

export type PublishStep = 'validating' | 'preparing' | 'uploading' | 'publishing' | 'complete' | 'error';

interface PublishProgressModalProps {
  isOpen: boolean;
  currentStep: PublishStep;
  error?: string | null;
  onClose: () => void;
}

export default function PublishProgressModal({
  isOpen,
  currentStep,
  error,
  onClose
}: PublishProgressModalProps) {
  if (!isOpen) return null;

  const steps = [
    { id: 'validating', label: 'Validating Content', description: 'Checking content and site connection...' },
    { id: 'preparing', label: 'Preparing Content', description: 'Formatting content for WordPress...' },
    { id: 'uploading', label: 'Uploading Content', description: 'Sending content to WordPress API...' },
    { id: 'publishing', label: 'Publishing to WordPress', description: 'Processing tags, categories, and making content live... (This may take 20-30 seconds)' },
    { id: 'complete', label: 'Complete', description: 'Your content has been published successfully!' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();

    if (currentStep === 'error') {
      if (stepIndex < currentIndex) return 'complete';
      if (stepIndex === currentIndex) return 'error';
      return 'pending';
    }

    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const isComplete = currentStep === 'complete';
  const hasError = currentStep === 'error';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-50">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isComplete ? 'Publishing Complete!' : hasError ? 'Publishing Failed' : 'Publishing to WordPress'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isComplete 
                  ? 'Your content is now live'
                  : hasError 
                  ? 'There was a problem publishing your content'
                  : 'Please wait while we publish your content...'}
              </p>
            </div>
            {(isComplete || hasError) && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Error Message */}
          {hasError && error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Publishing Error
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-start">
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mr-4">
                    {status === 'complete' ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    ) : status === 'active' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                      </div>
                    ) : status === 'error' ? (
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        status === 'active' 
                          ? 'text-blue-900 dark:text-blue-100'
                          : status === 'complete'
                          ? 'text-green-900 dark:text-green-100'
                          : status === 'error'
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      {status === 'active' && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          In Progress...
                        </span>
                      )}
                      {status === 'complete' && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      status === 'active'
                        ? 'text-blue-700 dark:text-blue-300'
                        : status === 'complete'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.description}
                    </p>

                    {/* Progress Line */}
                    {index < steps.length - 1 && (
                      <div className="ml-4 mt-2 h-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success Message */}
          {isComplete && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Success!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your content has been published and is now live on your WordPress site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(isComplete || hasError) && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {isComplete && (
                <button
                  onClick={() => {
                    // This will be handled by parent component
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Published Post
                </button>
              )}
            </div>
          )}

          {/* Don't close warning for active publishing */}
          {!isComplete && !hasError && (
            <div className="mt-6 space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                  ⚠️ Please don't close this window while publishing is in progress
                </p>
              </div>
              
              {(currentStep === 'uploading' || currentStep === 'publishing') && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                    ℹ️ WordPress is processing your content (tags, categories, formatting). This normally takes 20-30 seconds.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}