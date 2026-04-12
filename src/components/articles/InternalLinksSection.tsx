import React, { useState } from 'react';
import { LinkIcon, Plus, X, ExternalLink } from 'lucide-react';

interface InternalLink {
  url: string;
  anchorText: string;
  addedAt?: string;
}

interface InternalLinksSectionProps {
  links: InternalLink[];
  onLinksChange: (links: InternalLink[]) => void;
}

const InternalLinksSection: React.FC<InternalLinksSectionProps> = ({ links, onLinksChange }) => {
  const [newLink, setNewLink] = useState<InternalLink>({ url: '', anchorText: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddLink = () => {
    if (newLink.url && newLink.anchorText) {
      const linkWithDate = {
        ...newLink,
        addedAt: new Date().toISOString()
      };
      onLinksChange([...links, linkWithDate]);
      setNewLink({ url: '', anchorText: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onLinksChange(updatedLinks);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <LinkIcon className="w-4 h-4" />
          <span>Internal Links</span>
          {links.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
              {links.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
          type="button"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL (e.g., https://example.com/page)"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={newLink.anchorText}
              onChange={(e) => setNewLink({ ...newLink, anchorText: e.target.value })}
              placeholder="Anchor text"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddLink}
                disabled={!newLink.url || !newLink.anchorText}
                className="flex-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                type="button"
              >
                Add Link
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink({ url: '', anchorText: '' });
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-sm transition-colors"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No internal links added yet
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
            >
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {link.anchorText}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {link.url}
                </p>
              </div>
              <button
                onClick={() => handleRemoveLink(index)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          💡 Internal links help improve SEO and user navigation
        </p>
      )}
    </div>
  );
};

export default InternalLinksSection;