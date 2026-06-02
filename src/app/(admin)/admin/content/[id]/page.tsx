'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { ArrowLeft, FileText, User, Calendar, Globe, AlertTriangle, Loader, Hash } from 'lucide-react';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.content.getContentById(contentId);
        if (res.data.success) setContent(res.data.data);
        else throw new Error(res.data.message || 'Content not found');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    if (contentId) fetchContent();
  }, [contentId]);

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      published: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      draft:     'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
      pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      failed:    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };
    return map[status] || map.draft;
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    </AdminLayout>
  );

  if (error || !content) return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Content not found'}</p>
          <button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium">
            Go Back
          </button>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{content.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">ID: {content._id}</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${getStatusStyle(content.status)}`}>
            {content.status?.charAt(0).toUpperCase() + content.status?.slice(1)}
          </span>
        </div>

        {/* Meta */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Type</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{content.type || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Hash className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Word Count</p>
                <p className="font-medium text-gray-900 dark:text-white">{(content.wordCount || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Author</p>
                <p className="font-medium text-gray-900 dark:text-white truncate">{content.userId?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Created</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(content.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {(content.siteId?.name || content.keyword) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm">
              {content.siteId?.name && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                  <span>{content.siteId.name}</span>
                  {content.siteId.url && <a href={content.siteId.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">({content.siteId.url})</a>}
                </div>
              )}
              {content.keyword && (
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  {content.keyword}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content body */}
        {content.content ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Content</h2>
            <div
              className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No content body available.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}