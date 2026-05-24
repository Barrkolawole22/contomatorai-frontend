'use client';

// frontend/src/app/knowledgebase/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { knowledgebaseAPI } from '@/lib/api';
import { KnowledgeDoc } from '@/types';
import {
  Upload,
  Trash2,
  FileText,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  X,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status, error }: { status: KnowledgeDoc['status']; error?: string }) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle className="h-3 w-3" />
        Ready
      </span>
    );
  }
  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </span>
    );
  }
  return (
    <span
      title={error || 'Processing failed'}
      className="inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
    >
      <AlertCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

function FileTypeIcon({ type }: { type: KnowledgeDoc['fileType'] }) {
  return type === 'docx' ? (
    <FileText className="h-5 w-5 text-blue-500" />
  ) : (
    <File className="h-5 w-5 text-gray-500" />
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────

function DeleteModal({
  doc,
  onConfirm,
  onCancel,
  deleting,
}: {
  doc: KnowledgeDoc;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Delete document</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">"{doc.title}"</span>? This will remove the
          file and all its stored content. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload area ───────────────────────────────────────────────────────────

function UploadArea({
  onUploaded,
}: {
  onUploaded: (doc: KnowledgeDoc) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['docx', 'txt'].includes(ext)) {
        setError('Only .docx and .txt files are accepted.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File must be 10 MB or smaller.');
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('document', file);
        if (description.trim()) formData.append('description', description.trim());

        const res = await knowledgebaseAPI.upload(formData);
        onUploaded(res.data.data as KnowledgeDoc);
        setDescription('');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [description, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Upload document</h2>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-2 text-sm text-gray-600">Uploading and starting processing…</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700">
              Drop a file here or{' '}
              <span className="text-indigo-600 underline underline-offset-2">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">.docx or .txt — max 10 MB</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.txt"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Description{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Brand style research notes Q1 2026"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Documents table ───────────────────────────────────────────────────────

function DocumentsTable({
  docs,
  onDelete,
}: {
  docs: KnowledgeDoc[];
  onDelete: (doc: KnowledgeDoc) => void;
}) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
        <BookOpen className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">No documents yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Upload your first knowledge source above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Document</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Words</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Size</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map(doc => (
            <tr key={doc.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileTypeIcon type={doc.fileType} />
                  <div>
                    <p className="font-medium text-gray-900 leading-tight">{doc.title}</p>
                    {doc.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{doc.description}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 uppercase text-gray-500 text-xs font-medium">
                {doc.fileType}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {doc.totalWords > 0 ? doc.totalWords.toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} error={doc.processingError} />
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3 text-right text-gray-500">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(doc)}
                  title="Delete document"
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function KnowledgebasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<KnowledgeDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasProcessing = docs.some(d => d.status === 'processing');

  const fetchDocs = useCallback(async () => {
    try {
      const res = await knowledgebaseAPI.getDocuments();
      const docs = (res.data.data as any[]).map((d: any) => ({
        ...d,
        id: d._id,
      }));
      setDocs(docs as KnowledgeDoc[]);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err?.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(fetchDocs, 5000);
    return () => clearInterval(interval);
  }, [hasProcessing, fetchDocs]);

  const handleUploaded = (doc: KnowledgeDoc) => {
    setDocs(prev => [doc, ...prev]);
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await knowledgebaseAPI.deleteDocument(docToDelete.id);
      setDocs(prev => prev.filter(d => d.id !== docToDelete.id));
      setDocToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledgebase</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload source documents — your AI draws from these when generating content.
            </p>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            {docs.length} {docs.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>

        <UploadArea onUploaded={handleUploaded} />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : fetchError ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {fetchError}
          </div>
        ) : (
          <DocumentsTable docs={docs} onDelete={setDocToDelete} />
        )}

        {hasProcessing && (
          <p className="text-center text-xs text-gray-400">
            Documents are being processed — this page refreshes automatically.
          </p>
        )}
      </div>

      {docToDelete && (
        <DeleteModal
          doc={docToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDocToDelete(null)}
          deleting={deleting}
        />
      )}
    </DashboardLayout>
  );
}