'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { contentAPI, sitesAPI, schedulerAPI } from '@/lib/api';
import SchedulePostModal from '@/components/scheduler/SchedulePostModal';
import PublishProgressModal, { PublishStep } from '@/components/articles/PublishProgressModal';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  RefreshCw,
  Globe,
  Calendar,
  Clock,
  FileText,
  Tag,
  Target,
  Wand2,
  CheckCircle,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  Quote,
  List,
  ListOrdered,
  Code,
  Image,
  Underline,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
  Edit,
  Unlink
} from 'lucide-react';
import { Content } from '@/types/content.types';

// Add Site interface
interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

// ✅ NEW: Internal Link interface
interface InternalLink {
  url: string;
  anchorText: string;
  addedAt?: string;
}

// Enhanced WordPress-style Rich Text Editor Component with WordPress-style link editing
const WYSIWYGEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing..." 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string; 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [activeLink, setActiveLink] = useState<HTMLAnchorElement | null>(null);
  const [showLinkToolbar, setShowLinkToolbar] = useState(false);
  const [linkToolbarPosition, setLinkToolbarPosition] = useState({ x: 0, y: 0 });

  const prepareContentForEditing = useCallback((html: string): string => {
    if (!html) return '';
    
    return html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[^>]*>.*?<\/head>/gis, '')
      .replace(/<body[^>]*>|<\/body>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<title[^>]*>.*?<\/title>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .trim();
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== currentContent) {
      const cleanContent = prepareContentForEditing(value);
      
      if (cleanContent !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = cleanContent;
        setCurrentContent(value);
        setIsInitialized(true);
        applyHeadingStyles();
        applyLinkStyles();
      }
    }
  }, [value, prepareContentForEditing, currentContent]);

  const applyHeadingStyles = useCallback(() => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      const tagName = heading.tagName.toLowerCase();
      heading.className = '';
      switch (tagName) {
        case 'h1':
          heading.className = 'text-3xl font-bold text-gray-900 dark:text-white my-6 pb-2 border-b-2 border-gray-300 dark:border-gray-600 leading-tight';
          break;
        case 'h2':
          heading.className = 'text-2xl font-bold text-gray-900 dark:text-white my-5 pb-2 border-b border-gray-200 dark:border-gray-700 leading-tight';
          break;
        case 'h3':
          heading.className = 'text-xl font-semibold text-gray-900 dark:text-white my-4 leading-tight';
          break;
        case 'h4':
          heading.className = 'text-lg font-semibold text-gray-900 dark:text-white my-3 leading-tight';
          break;
        case 'h5':
          heading.className = 'text-base font-semibold text-gray-900 dark:text-white my-3 leading-tight';
          break;
        case 'h6':
          heading.className = 'text-sm font-semibold text-gray-900 dark:text-white my-2 leading-tight';
          break;
      }
    });
  }, []);

  // ✅ Apply link styles
  const applyLinkStyles = useCallback(() => {
    if (!editorRef.current) return;
    const links = editorRef.current.querySelectorAll('a');
    links.forEach((link) => {
      if (!link.hasAttribute('target')) link.setAttribute('target', '_blank');
      if (!link.hasAttribute('rel')) link.setAttribute('rel', 'noopener noreferrer');
      link.className = 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer editor-link';
      
      // Add data attributes for identification
      link.setAttribute('data-link', 'true');
    });
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const rawContent = editorRef.current.innerHTML;
      setTimeout(() => {
        applyHeadingStyles();
        applyLinkStyles();
      }, 10);
      setCurrentContent(rawContent);
      onChange(rawContent);
    }
  }, [onChange, applyHeadingStyles, applyLinkStyles]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        document.execCommand(command, false, value);
        handleInput();
      } catch (error) {
        console.error('Error executing command:', command, error);
      }
    }
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        if (document.execCommand('insertHTML', false, html)) {
          handleInput();
          return;
        }
      } catch (error) {
        console.log('execCommand failed, using fallback method');
      }
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = document.createRange().createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
      }
    }
  }, [handleInput]);

  const handleHeading = useCallback((level: string) => {
    if (!editorRef.current || !level) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode as Node;
    }
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      const blockElement = (element as Element).closest('p, h1, h2, h3, h4, h5, h6, div') || element;
      if (blockElement && blockElement.parentNode) {
        const newHeading = document.createElement(`h${level}`);
        newHeading.innerHTML = blockElement.textContent || '';
        const headingClasses = {
          '1': 'text-3xl font-bold text-gray-900 dark:text-white my-6 pb-2 border-b-2 border-gray-300 dark:border-gray-600 leading-tight',
          '2': 'text-2xl font-bold text-gray-900 dark:text-white my-5 pb-2 border-b border-gray-200 dark:border-gray-700 leading-tight',
          '3': 'text-xl font-semibold text-gray-900 dark:text-white my-4 leading-tight',
          '4': 'text-lg font-semibold text-gray-900 dark:text-white my-3 leading-tight',
          '5': 'text-base font-semibold text-gray-900 dark:text-white my-3 leading-tight',
          '6': 'text-sm font-semibold text-gray-900 dark:text-white my-2 leading-tight'
        };
        newHeading.className = headingClasses[level as keyof typeof headingClasses] || '';
        blockElement.parentNode.replaceChild(newHeading, blockElement);
        const newRange = document.createRange();
        newRange.selectNodeContents(newHeading);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
        handleInput();
      }
    }
  }, [handleInput]);

  const handleBold = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    execCommand('bold');
  }, [execCommand]);

  const handleItalic = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    execCommand('italic');
  }, [execCommand]);

  const handleUnderline = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    execCommand('underline');
  }, [execCommand]);

  const handleStrikethrough = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    execCommand('strikethrough');
  }, [execCommand]);

  const handleAlign = useCallback((alignment: string, e: React.MouseEvent) => {
    e.preventDefault();
    execCommand(`justify${alignment}`);
  }, [execCommand]);

  const handleList = useCallback((type: 'ordered' | 'unordered', e: React.MouseEvent) => {
    e.preventDefault();
    if (type === 'ordered') {
      execCommand('insertOrderedList');
    } else {
      execCommand('insertUnorderedList');
    }
  }, [execCommand]);

  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const handleLink = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    let selectedText = '';
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
      if (!selection.isCollapsed) {
        selectedText = selection.toString();
      }
    }
    setSavedRange(range);
    setLinkText(selectedText);
    setLinkUrl('');
    setActiveLink(null);
    setShowLinkDialog(true);
  }, []);

  // ✅ NEW: WordPress-style link editing functions
  const handleEditLink = useCallback((linkElement: HTMLAnchorElement) => {
    setActiveLink(linkElement);
    setLinkUrl(linkElement.href);
    setLinkText(linkElement.textContent || '');
    setShowLinkDialog(true);
  }, []);

  const handleRemoveLink = useCallback((linkElement: HTMLAnchorElement) => {
    // Replace the link with its text content
    const textNode = document.createTextNode(linkElement.textContent || '');
    linkElement.parentNode?.replaceChild(textNode, linkElement);
    setShowLinkToolbar(false);
    setActiveLink(null);
    handleInput();
  }, [handleInput]);

  const insertLink = useCallback(() => {
    if (!linkUrl.trim() || !editorRef.current) return;
    const url = linkUrl.trim();
    const text = linkText.trim() || url;
    editorRef.current.focus();

    if (activeLink) {
      // ✅ UPDATE EXISTING LINK
      activeLink.href = url;
      activeLink.textContent = text;
      activeLink.className = 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer editor-link';
      activeLink.setAttribute('data-link', 'true');
    } else {
      // Insert new link
      const selection = window.getSelection();
      if (selection && savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
        if (!savedRange.collapsed) {
          savedRange.deleteContents();
        }
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        linkElement.className = 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer editor-link';
        linkElement.setAttribute('data-link', 'true');
        linkElement.textContent = text;
        savedRange.insertNode(linkElement);
        const newRange = document.createRange();
        newRange.setStartAfter(linkElement);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer editor-link" data-link="true">${text}</a>`;
        insertHTML(linkHtml);
      }
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    setSavedRange(null);
    setActiveLink(null);
    handleInput();
  }, [linkUrl, linkText, activeLink, savedRange, handleInput, insertHTML]);

  // ✅ NEW: WordPress-style link click handler
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked on a link or link toolbar button
    if (target.closest('.link-toolbar') || target.closest('.link-toolbar-button')) {
      return; // Don't hide toolbar if clicking on toolbar itself
    }

    const link = target.closest('a.editor-link') as HTMLAnchorElement;
    
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get link position for toolbar placement
      const rect = link.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      
      if (editorRect) {
        setLinkToolbarPosition({
          x: rect.left - editorRect.left + rect.width / 2,
          y: rect.top - editorRect.top - 45
        });
      }
      
      setActiveLink(link);
      setShowLinkToolbar(true);
      
      // Select the link text for visual feedback
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(link);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      // Clicked outside a link, hide the toolbar
      setShowLinkToolbar(false);
      setActiveLink(null);
    }
  }, []);

  const handleImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const url = prompt('Enter image URL:');
    if (url) {
      const alt = prompt('Enter alt text (optional):') || 'Image';
      const imageHtml = `<img src="${url}" alt="${alt}" class="max-w-full h-auto my-4 rounded-lg" />`;
      insertHTML(imageHtml);
    }
  }, [insertHTML]);

  const handleQuote = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    let selectedText = selection && !selection.isCollapsed ? selection.toString() : 'Quote text here...';
    const quoteHtml = `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800 italic">${selectedText}</blockquote>`;
    insertHTML(quoteHtml);
  }, [insertHTML]);

  const handleCode = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    let selectedText = selection && !selection.isCollapsed ? selection.toString() : 'code';
    const codeHtml = `<code class="bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded text-sm font-mono">${selectedText}</code>`;
    insertHTML(codeHtml);
  }, [insertHTML]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    if (htmlData) {
      const cleanHtml = htmlData
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<meta[^>]*>/gi, '');
      insertHTML(cleanHtml);
    } else {
      const processedText = textData.replace(/\n/g, '<br>');
      insertHTML(processedText);
    }
  }, [insertHTML]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleBold(e as any);
          break;
        case 'i':
          e.preventDefault();
          handleItalic(e as any);
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        default:
          break;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      execCommand('insertParagraph');
    }
  }, [execCommand, handleBold, handleItalic]);

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showLinkToolbar && editorRef.current) {
        const target = e.target as HTMLElement;
        if (!target.closest('.editor-link') && !target.closest('.link-toolbar')) {
          setShowLinkToolbar(false);
          setActiveLink(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkToolbar]);

  return (
    <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <select
            onChange={(e) => {
              if (e.target.value) {
                if (e.target.value === 'p') {
                  execCommand('formatBlock', 'p');
                } else {
                  handleHeading(e.target.value);
                }
                e.target.value = '';
              }
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            defaultValue=""
          >
            <option value="" disabled>Format</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
            <option value="p">Paragraph</option>
          </select>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {[
            { handler: handleBold, icon: Bold, title: 'Bold (Ctrl+B)' },
            { handler: handleItalic, icon: Italic, title: 'Italic (Ctrl+I)' },
            { handler: handleUnderline, icon: Underline, title: 'Underline (Ctrl+U)' },
            { handler: handleStrikethrough, icon: Strikethrough, title: 'Strikethrough' }
          ].map(({ handler, icon: Icon, title }, index) => (
            <button
              key={index}
              onClick={handler}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={title}
              type="button"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {[
            { alignment: 'Left', icon: AlignLeft },
            { alignment: 'Center', icon: AlignCenter },
            { alignment: 'Right', icon: AlignRight }
          ].map(({ alignment, icon: Icon }) => (
            <button
              key={alignment}
              onClick={(e) => handleAlign(alignment, e)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={`Align ${alignment}`}
              type="button"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <button
            onClick={(e) => handleList('unordered', e)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Bullet List"
            type="button"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => handleList('ordered', e)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Numbered List"
            type="button"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {[
            { handler: handleLink, icon: LinkIcon, title: 'Insert Link' },
            { handler: handleImage, icon: Image, title: 'Insert Image' },
            { handler: handleQuote, icon: Quote, title: 'Quote' },
            { handler: handleCode, icon: Code, title: 'Inline Code' }
          ].map(({ handler, icon: Icon, title }, index) => (
            <button
              key={index}
              onClick={handler}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={title}
              type="button"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onClick={handleEditorClick}
          className="min-h-96 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/2Lh-96 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 wysiwyg-editor-content"
          style={{ 
            lineHeight: '1.6',
            fontSize: '16px'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />

        {/* ✅ WordPress-style Link Toolbar */}
        {showLinkToolbar && activeLink && (
          <div 
            className="absolute z-50 link-toolbar bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-1 flex items-center space-x-1"
            style={{
              left: `${linkToolbarPosition.x}px`,
              top: `${linkToolbarPosition.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <button
              onClick={() => handleEditLink(activeLink)}
              className="link-toolbar-button p-2 text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-600 rounded transition-colors"
              title="Edit Link"
              type="button"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleRemoveLink(activeLink)}
              className="link-toolbar-button p-2 text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-600 rounded transition-colors"
              title="Remove Link"
              type="button"
            >
              <Unlink className="w-4 h-4" />
            </button>
            
            <a
              href={activeLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-toolbar-button p-2 text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-600 rounded transition-colors"
              title="Visit Link"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {showLinkDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {activeLink ? 'Edit Link' : 'Insert Link'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Link text"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setActiveLink(null);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                type="button"
              >
                {activeLink ? 'Update Link' : 'Insert Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        .wysiwyg-editor-content h1 {
          font-size: 1.875rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          margin: 1.5rem 0 !important;
          padding-bottom: 0.5rem !important;
          border-bottom: 2px solid #d1d5db !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h1 {
          color: #f9fafb !important;
          border-bottom-color: #4b5563 !important;
        }
        
        .wysiwyg-editor-content h2 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          margin: 1.25rem 0 !important;
          padding-bottom: 0.5rem !important;
          border-bottom: 1px solid #e5e7eb !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h2 {
          color: #f9fafb !important;
          border-bottom-color: #374151 !important;
        }
        
        .wysiwyg-editor-content h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 1rem 0 !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h3 {
          color: #f9fafb !important;
        }
        
        .wysiwyg-editor-content h4 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 0.75rem 0 !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h4 {
          color: #f9fafb !important;
        }
        
        .wysiwyg-editor-content h5 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 0.75rem 0 !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h5 {
          color: #f9fafb !important;
        }
        
        .wysiwyg-editor-content h6 {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 0.5rem 0 !important;
          line-height: 1.2 !important;
        }
        
        .dark .wysiwyg-editor-content h6 {
          color: #f9fafb !important;
        }
        
        .wysiwyg-editor-content p {
          margin: 1rem 0 !important;
          line-height: 1.6 !important;
        }
        
        .wysiwyg-editor-content blockquote {
          margin: 1.5rem 0 !important;
          padding: 1rem 1.5rem !important;
          border-left: 4px solid #3b82f6 !important;
          background: #f3f4f6 !important;
          font-style: italic !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        
        .dark .wysiwyg-editor-content blockquote {
          background: #1f2937 !important;
          border-left-color: #60a5fa !important;
        }
        
        .wysiwyg-editor-content code {
          background: #f3f4f6 !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-family: monospace !important;
          font-size: 0.875rem !important;
          color: #3b82f6 !important;
        }
        
        .wysiwyg-editor-content a.editor-link {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          transition: color 0.2s !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
        }
        
        .wysiwyg-editor-content a.editor-link:hover {
          color: #1e40af !important;
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        
        .dark .wysiwyg-editor-content a.editor-link {
          color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.1) !important;
        }
        
        .dark .wysiwyg-editor-content a.editor-link:hover {
          color: #93c5fd !important;
          background-color: rgba(96, 165, 250, 0.2) !important;
        }
        
        .wysiwyg-editor-content ul, 
        .wysiwyg-editor-content ol {
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        
        .wysiwyg-editor-content li {
          margin: 0.5rem 0 !important;
          line-height: 1.6 !important;
        }
        
        .wysiwyg-editor-content img {
          max-width: 100 !important;
          height: auto !important;
          margin: 1rem 0 !important;
          border-radius: 0.5rem !important;
        }
        
        .wysiwyg-editor-content strong {
          font-weight: 600 !important;
        }
        
        .wysiwyg-editor-content em {
          font-style: italic !important;
        }
      `}</style>
    </div>
  );
};

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // NEW: Scheduling and Publishing States
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [publishStep, setPublishStep] = useState<PublishStep>('validating');
  const [showPublishProgress, setShowPublishProgress] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // ✅ STEP 1: Add internal link states
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [newInternalLink, setNewInternalLink] = useState({ url: '', anchorText: '' });

  // ✅ STEP 2: Update formData to include internalLinks
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    keyword: '',
    metaDescription: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledFor: '',
    tags: [] as string[],
    internalLinks: [] as InternalLink[] // ✅ ADDED
  });

  useEffect(() => {
    loadArticle();
    loadSites();
  }, [params.id]);

  useEffect(() => {
    const textContent = formData.content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    setArticle(prev => prev ? {
      ...prev,
      title: formData.title,
      body: formData.content,
      excerpt: formData.excerpt,
      wordCount,
      readingTime,
      updatedAt: new Date().toISOString()
    } : null);
  }, [formData]);

  useEffect(() => {
    if (unsavedChanges && article && formData.content.trim()) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, unsavedChanges]);

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getUserSites();
      if (response.data.success) {
        setSites(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    if (article?.id && siteId) {
      try {
        await contentAPI.associateWithSite(article.id, siteId);
        setArticle(prev => prev ? { ...prev, siteId } : null);
      } catch (error) {
        console.error('Error associating site:', error);
      }
    }
  };

  // ✅ STEP 3: Update loadArticle to include internalLinks
  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contentAPI.getContentById(params.id as string);
      
      if (response.data?.success) {
        const articleData = response.data.data;
        setArticle(articleData);
        
        if (articleData.siteId) {
          setSelectedSiteId(articleData.siteId);
        }
        
        const initialFormData = {
          title: articleData.title,
          content: articleData.body || '',
          excerpt: articleData.excerpt || '',
          keyword: articleData.metadata?.focusKeyword || '',
          metaDescription: articleData.metadata?.metaDescription || '',
          slug: articleData.metadata?.slug || '',
          status: articleData.status,
          scheduledFor: articleData.scheduledFor || '',
          tags: articleData.tags || [],
          internalLinks: articleData.internalLinks || [] // ✅ ADDED
        };
        
        setFormData(initialFormData);
        setUnsavedChanges(false);
      } else {
        throw new Error(response.data?.message || 'Failed to load article');
      }
    } catch (err: any) {
      console.error('Error loading article:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | InternalLink[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
      setUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setUnsavedChanges(true);
  };

  // ✅ STEP 4: Add internal link handlers
  const handleAddInternalLink = () => {
    if (newInternalLink.url && newInternalLink.anchorText) {
      const linkWithDate = {
        ...newInternalLink,
        addedAt: new Date().toISOString()
      };
      setFormData(prev => ({
        ...prev,
        internalLinks: [...prev.internalLinks, linkWithDate]
      }));
      setNewInternalLink({ url: '', anchorText: '' });
      setShowAddLinkForm(false);
      setUnsavedChanges(true);
    }
  };

  const handleRemoveInternalLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      internalLinks: prev.internalLinks.filter((_, i) => i !== index)
    }));
    setUnsavedChanges(true);
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    handleInputChange('slug', slug);
  };

  const generateExcerpt = () => {
    const textContent = formData.content.replace(/<[^>]*>/g, '');
    const excerpt = textContent
      .split('\n')
      .filter(line => line.trim().length > 0)[0]
      ?.substring(0, 160) + '...';
    if (excerpt) {
      handleInputChange('excerpt', excerpt);
    }
  };

  const handleAutoSave = async () => {
    if (!unsavedChanges || !article) return;
    
    setSaveStatus('saving');
    try {
      const updateData = {
        title: formData.title || 'Untitled',
        body: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
        tags: formData.tags,
        internalLinks: formData.internalLinks, // ✅ ADDED
        metadata: {
          focusKeyword: formData.keyword,
          metaDescription: formData.metaDescription,
          slug: formData.slug
        }
      };
      
      const response = await contentAPI.updateContent(params.id as string, updateData);
      
      if (response.data?.success) {
        setUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        throw new Error(response.data?.message || 'Auto-save failed');
      }
    } catch (error: any) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // ✅ STEP 5: Update handleSave to include internalLinks
  const handleSave = async (newStatus?: 'draft' | 'published' | 'scheduled') => {
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      const statusToSave = newStatus || formData.status;
      const updateData = {
        title: formData.title || 'Untitled',
        body: formData.content,
        excerpt: formData.excerpt,
        status: statusToSave,
        tags: formData.tags,
        internalLinks: formData.internalLinks, // ✅ ADDED
        metadata: {
          focusKeyword: formData.keyword,
          metaDescription: formData.metaDescription,
          slug: formData.slug
        },
        ...(formData.scheduledFor && statusToSave === 'scheduled' ? { 
          scheduledFor: formData.scheduledFor 
        } : {})
      };
      
      const response = await contentAPI.updateContent(params.id as string, updateData);
      
      if (response.data?.success) {
        if (newStatus) {
          setFormData(prev => ({ ...prev, status: statusToSave }));
        }
        
        setUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
        
        setArticle(prev => prev ? {
          ...prev,
          ...response.data.data,
          body: formData.content
        } : null);
      } else {
        throw new Error(response.data?.message || 'Failed to save article');
      }
    } catch (err: any) {
      setSaveStatus('error');
      console.error('Error saving article:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save article';
      alert(`Save failed: ${errorMessage}`);
      
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishError(null);
    setShowPublishProgress(true);
    
    try {
      setPublishStep('validating');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!selectedSiteId) {
        setPublishError('Please select a WordPress site before publishing');
        setPublishStep('error');
        return;
      }

      setPublishStep('preparing');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPublishStep('uploading');
      
      const response = await contentAPI.publishContent(article!.id, { siteId: selectedSiteId });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Publishing failed');
      }

      setPublishStep('publishing');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPublishStep('complete');
      
      setTimeout(() => {
        const publishData = response.data.data;
        const selectedSite = sites.find(s => s.id === selectedSiteId);
        
        const params = new URLSearchParams({
          published: 'true',
          wordpressUrl: publishData?.wordpressUrl || '',
          postId: publishData?.wordpressPostId || '',
          siteName: selectedSite?.name || publishData?.site || '',
          publishedAt: new Date().toISOString()
        });
        
        router.push(`/articles/${article!.id}?${params.toString()}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error publishing article:', error);
      
      let errorMessage = 'Failed to publish content';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Publishing timed out. The post may still be processing on WordPress. Please check your WordPress site and refresh this page.';
      } else if (error.response?.status === 500) {
        errorMessage = 'WordPress server error. The post may have been published. Please check your WordPress site.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPublishError(errorMessage);
      setPublishStep('error');
    }
  };

  const handleScheduleSuccess = (scheduleData: any) => {
    setArticle(prev => prev ? {
      ...prev,
      status: 'scheduled',
      scheduledFor: scheduleData.scheduledFor
    } : null);
    
    setFormData(prev => ({
      ...prev,
      status: 'scheduled',
      scheduledFor: scheduleData.scheduledFor
    }));
  };

  const handleDelete = async () => {
    try {
      await contentAPI.deleteContent(params.id as string);
      router.push('/articles');
    } catch (err: any) {
      console.error('Error deleting article:', err);
      alert(err.response?.data?.message || 'Failed to delete article');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-gray-600 dark:text-gray-300">Loading article...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Article</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={loadArticle}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/articles"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
          <Link
            href="/articles"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Articles</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/articles"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Article</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Last updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{article.wordCount || 0} words</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.readingTime || 0} min read</span>
                </span>
                {saveStatus === 'saved' && (
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave()}
              disabled={saving || !unsavedChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              type="button"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            
            {formData.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={publishing || !selectedSiteId}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                type="button"
              >
                <Globe className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Title */}
              <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-0 py-2 border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-white text-2xl font-bold placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your title here..."
                />
              </div>

              {/* WYSIWYG Editor */}
              <div className="p-6">
                <WYSIWYGEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Start writing your article..."
                />
              </div>

              {/* Excerpt */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Excerpt
                  </label>
                  <button
                    onClick={generateExcerpt}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    type="button"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Brief description of your article..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.excerpt.length}/160 characters recommended
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* SEO Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>SEO</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter keyword..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </label>
                    <button
                      onClick={generateSlug}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      type="button"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="article-slug"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    rows={2}
                    placeholder="Meta description..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaDescription.length}/160
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Add tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ✅ STEP 6: Internal Links Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>Internal Links</span>
                  {formData.internalLinks.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                      {formData.internalLinks.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                  className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showAddLinkForm && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newInternalLink.url}
                      onChange={(e) => setNewInternalLink({ ...newInternalLink, url: e.target.value })}
                      placeholder="URL (e.g., https://example.com/page)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newInternalLink.anchorText}
                      onChange={(e) => setNewInternalLink({ ...newInternalLink, anchorText: e.target.value })}
                      placeholder="Anchor text"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddInternalLink}
                        disabled={!newInternalLink.url || !newInternalLink.anchorText}
                        className="flex-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                        type="button"
                      >
                        Add Link
                      </button>
                      <button
                        onClick={() => {
                          setShowAddLinkForm(false);
                          setNewInternalLink({ url: '', anchorText: '' });
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

              {formData.internalLinks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No internal links added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.internalLinks.map((link, index) => (
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
                        onClick={() => handleRemoveInternalLink(index)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.internalLinks.length > 0 && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  💡 Internal links help improve SEO and user navigation
                </p>
              )}
            </div>

            {/* Site Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>WordPress Site</span>
              </h3>
              
              {sites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    No sites connected
                  </p>
                  <Link
                    href="/dashboard/sites"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Add a site →
                  </Link>
                </div>
              ) : (
                <div>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => handleSiteSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedSiteId && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-800 dark:text-green-300">
                          Site linked
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Publishing Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Publishing</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Post</span>
                </button>

                {formData.status === 'scheduled' && formData.scheduledFor && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                      Scheduled For:
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {new Date(formData.scheduledFor).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, scheduledFor: '', status: 'draft' }));
                      }}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Cancel Schedule
                    </button>
                  </div>
                )}

                {article?.publishedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Published On
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {article?.wordpressSite && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      WordPress Site
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {article.wordpressSite}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Article Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Stats</span>
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Words</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {article.wordCount?.toLocaleString() || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reading Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {article.readingTime || 0} min
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Modified</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Post Modal */}
        <SchedulePostModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          contentId={article?.id || ''}
          contentTitle={formData.title}
          sites={sites}
          onScheduleSuccess={handleScheduleSuccess}
        />

        {/* Publishing Progress Modal */}
        <PublishProgressModal
          isOpen={showPublishProgress}
          currentStep={publishStep}
          error={publishError}
          onClose={() => {
            setShowPublishProgress(false);
            setPublishStep('validating');
            setPublishError(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Article
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{article.title}"? This will permanently remove the article and all its data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  type="button"
                >
                  Delete Article
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg p-4 shadow-lg z-40">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                You have unsaved changes
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}