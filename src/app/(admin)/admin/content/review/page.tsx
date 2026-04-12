'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { authAPI } from '@/lib/api';
import { 
  Eye,
  Check,
  X,
  Flag,
  FileText,
  User,
  Calendar,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react';

interface ReviewContent {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  qualityScore?: number;
  seoScore?: number;
  wordCount: number;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ContentFilters {
  status: string;
  qualityRange: string;
  search: string;
}

const AdminContentReview = () => {
  const { user } = useAuth();
  const [reviewContent, setReviewContent] = useState<ReviewContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContent, setSelectedContent] = useState<ReviewContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_revision: 0
  });
  
  const [filters, setFilters] = useState<ContentFilters>({
    status: 'pending',
    qualityRange: 'all',
    search: ''
  });

  const [reviewAction, setReviewAction] = useState<{
    contentId: string;
    action: 'approve' | 'reject' | 'needs_revision';
    notes: string;
  } | null>(null);

  useEffect(() => {
    fetchReviewContent();
  }, [currentPage, filters]);

  const fetchReviewContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== 'all'))
      });

      const response = await authAPI.get(`/admin/content/review?${params}`);
      
      setReviewContent(response.data.data.reviewQueue || []);
      setStatistics(response.data.data.statistics || {
        pending: 0,
        approved: 0,
        rejected: 0,
        needs_revision: 0
      });
      
      // Calculate pagination from response if available
      if (response.data.data.pagination) {
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.totalCount);
      }
    } catch (err: any) {
      console.error('Error fetching review content:', err);
      setError(err.response?.data?.message || 'Failed to fetch content for review');
    } finally {
      setLoading(false);
    }
  };

  const handleContentAction = async (contentId: string, action: 'approve' | 'reject' | 'needs_revision', notes?: string) => {
    try {
      await authAPI.put(`/admin/content/${contentId}`, { 
        reviewStatus: action,
        reviewNotes: notes,
        reviewedBy: user?.id,
        reviewedAt: new Date().toISOString()
      });
      
      fetchReviewContent();
      setShowContentModal(false);
      setReviewAction(null);
    } catch (err: any) {
      console.error('Content action error:', err);
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      needs_revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      needs_revision: AlertTriangle
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getQualityBadge = (score?: number) => {
    if (!score) return null;
    
    const getColor = (score: number) => {
      if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getColor(score)}`}>
        <Star className="w-3 h-3 mr-1" />
        {score}/100
      </span>
    );
  };

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access content review.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Content Review Queue
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and approve content before publication
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchReviewContent}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{statistics.pending}</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">Pending Review</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{statistics.approved}</p>
                <p className="text-green-700 dark:text-green-300 text-sm">Approved</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{statistics.rejected}</p>
                <p className="text-red-700 dark:text-red-300 text-sm">Rejected</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{statistics.needs_revision}</p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">Needs Revision</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content by title..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="needs_revision">Needs Revision</option>
            </select>

            <select
              value={filters.qualityRange}
              onChange={(e) => setFilters({ ...filters, qualityRange: e.target.value })}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Quality</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low (&lt;60)</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading content for review...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchReviewContent}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : reviewContent.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No content found for review</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            reviewContent.map((content) => (
              <div
                key={content._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {content.title}
                      </h3>
                      {getStatusBadge(content.reviewStatus)}
                      {getQualityBadge(content.qualityScore)}
                      {content.seoScore && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          SEO: {content.seoScore}/100
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {content.excerpt || content.content.substring(0, 200) + '...'}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{content.author.name}</span>
                        <span className="text-gray-400 ml-2">({content.author.email})</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        <span>{content.wordCount.toLocaleString()} words</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {content.reviewNotes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center mb-1">
                          <MessageSquare className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Review Notes:</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{content.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedContent(content);
                        setShowContentModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    {content.reviewStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleContentAction(content._id, 'approve')}
                          className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setReviewAction({
                              contentId: content._id,
                              action: 'needs_revision',
                              notes: ''
                            });
                          }}
                          className="p-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          title="Needs Revision"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setReviewAction({
                              contentId: content._id,
                              action: 'reject',
                              notes: ''
                            });
                          }}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                  {totalCount > 0 && (
                    <span> ({totalCount.toLocaleString()} total items)</span>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Content Review Details
                </h3>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Content Info */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedContent.title}
                    </h4>
                    {getStatusBadge(selectedContent.reviewStatus)}
                    {getQualityBadge(selectedContent.qualityScore)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Author:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedContent.author.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedContent.author.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Word Count:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedContent.wordCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(selectedContent.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedContent.qualityScore && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Quality Score:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedContent.qualityScore}/100</span>
                      </div>
                    )}
                    {selectedContent.seoScore && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">SEO Score:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedContent.seoScore}/100</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Content Preview</h5>
                  <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="prose dark:prose-invert max-w-none">
                      {selectedContent.content.length > 2000 
                        ? selectedContent.content.substring(0, 2000) + '...' 
                        : selectedContent.content}
                    </div>
                  </div>
                </div>

                {/* Previous Review Notes */}
                {selectedContent.reviewNotes && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Previous Review Notes</h5>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300">{selectedContent.reviewNotes}</p>
                      {selectedContent.reviewedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Reviewed {new Date(selectedContent.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedContent.reviewStatus === 'pending' && (
                  <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleContentAction(selectedContent._id, 'approve')}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Content
                    </button>
                    
                    <button
                      onClick={() => {
                        setReviewAction({
                          contentId: selectedContent._id,
                          action: 'needs_revision',
                          notes: ''
                        });
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-3 border border-orange-600 text-orange-600 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Needs Revision
                    </button>
                    
                    <button
                      onClick={() => {
                        setReviewAction({
                          contentId: selectedContent._id,
                          action: 'reject',
                          notes: ''
                        });
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-3 border border-red-600 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Action Modal */}
      {reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {reviewAction.action === 'reject' ? 'Reject Content' : 'Request Revision'}
                </h3>
                <button
                  onClick={() => setReviewAction(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes {reviewAction.action === 'reject' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    value={reviewAction.notes}
                    onChange={(e) => setReviewAction({ ...reviewAction, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      reviewAction.action === 'reject' 
                        ? 'Please explain why this content is being rejected...'
                        : 'Please specify what revisions are needed...'
                    }
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setReviewAction(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleContentAction(reviewAction.contentId, reviewAction.action, reviewAction.notes)}
                    disabled={reviewAction.action === 'reject' && !reviewAction.notes.trim()}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      reviewAction.action === 'reject'
                        ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                        : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {reviewAction.action === 'reject' ? 'Reject' : 'Request Revision'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContentReview;
