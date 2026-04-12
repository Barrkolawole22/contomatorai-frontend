import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { contentAPI, schedulerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'post' | 'page' | 'blog';
  status: 'draft' | 'ready' | 'generating' | 'publishing' | 'scheduled' | 'published' | 'failed';
  keywords: string[];
  seoScore?: number;
  wordpressPostId?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  readingTime?: number;
  primaryKeyword?: string;
  site?: {
    id: string;
    name: string;
    url: string;
  };
}

export interface ContentGenerationParams {
  keyword: string;
  siteId?: string;
  model?: string; 
  title?: string;
  options?: {
    tone?: 'informative' | 'conversational' | 'professional' | 'friendly' | 'authoritative';
    wordCount?: number;
    includeHeadings?: boolean;
    includeIntroduction?: boolean;
    includeConclusion?: boolean;
    extraInstructions?: string;
  };
}

// ✅ Expanded Interface to match everything your components expect
export interface UseContentReturn {
  contents: ContentItem[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  generateContent: (params: ContentGenerationParams) => Promise<ContentItem>;
  createContent: (params: ContentGenerationParams) => Promise<ContentItem>;
  updateContent: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem>;
  saveContent: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem>;
  updateContentMeta: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem>;
  deleteContent: (id: string) => Promise<void>;
  publishToWordPress: (contentId: string) => Promise<void>;
  getContent: (id: string) => ContentItem | undefined;
  getContentById: (id: string) => ContentItem | undefined;
  refreshContents: () => void;
  getContentList: () => void;
  getContentAnalytics: (id: string) => Promise<any>;
  scheduleContent: (data: any) => Promise<any>;
}

export const useContent = (): UseContentReturn => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: contents = [],
    isLoading: isQueryLoading,
    refetch: refreshContents,
  } = useQuery<ContentItem[]>('contents', async () => {
    const response = await contentAPI.getContent();
    
    if (response.data.success) {
      return response.data.data || [];
    }
    throw new Error(response.data.message || 'Failed to fetch contents');
  }, {
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to fetch contents';
      setError(message);
      toast.error(message);
    },
  });

  const generateContentMutation = useMutation(
    async (params: ContentGenerationParams) => {
      const response = await contentAPI.generateContent(params);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Content generation failed');
    },
    {
      onSuccess: (newContent) => {
        queryClient.setQueryData<ContentItem[]>('contents', (old = []) => [
          newContent,
          ...old,
        ]);
        toast.success('Content generated successfully!');
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || err.message || 'Failed to generate content';
        setError(message);
        toast.error(message);
      },
    }
  );

  const updateContentMutation = useMutation(
    async ({ id, updates }: { id: string; updates: Partial<ContentItem> }) => {
      // ✅ Cast updates to 'any' here locally to prevent strict literal mismatches with status fields
      const response = await contentAPI.updateContent(id, updates as any);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Update failed');
    },
    {
      onSuccess: (updatedContent) => {
        queryClient.setQueryData<ContentItem[]>('contents', (old = []) =>
          old.map((content) =>
            content.id === updatedContent.id ? updatedContent : content
          )
        );
        toast.success('Content updated successfully!');
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || err.message || 'Failed to update content';
        setError(message);
        toast.error(message);
      },
    }
  );

  const deleteContentMutation = useMutation(
    async (id: string) => {
      const response = await contentAPI.deleteContent(id);
      
      if (response.data.success) {
        return id;
      }
      throw new Error(response.data.message || 'Delete failed');
    },
    {
      onSuccess: (deletedId) => {
        queryClient.setQueryData<ContentItem[]>('contents', (old = []) =>
          old.filter((content) => content.id !== deletedId)
        );
        toast.success('Content deleted successfully!');
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || err.message || 'Failed to delete content';
        setError(message);
        toast.error(message);
      },
    }
  );

  const publishToWordPressMutation = useMutation(
    async (contentId: string) => {
      console.log('Publishing content:', contentId);
      const response = await contentAPI.publishContent(contentId, {});
      
      console.log('Publish response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Publishing failed');
    },
    {
      onSuccess: (result) => {
        console.log('Published successfully:', result);
        
        queryClient.setQueryData<ContentItem[]>('contents', (old = []) =>
          old.map((content) =>
            content.id === result.contentId
              ? { 
                  ...content, 
                  wordpressPostId: result.wordpressPostId?.toString(), 
                  status: 'published' as const,
                  publishedUrl: result.wordpressUrl
                }
              : content
          )
        );
        
        queryClient.invalidateQueries('contents');
        
        toast.success(`Published to WordPress! URL: ${result.wordpressUrl}`);
      },
      onError: (err: any) => {
        console.error('Publish error:', err);
        const message = err.response?.data?.message || err.message || 'Failed to publish to WordPress';
        setError(message);
        toast.error(message);
      },
    }
  );

  const generateContent = useCallback(
    async (params: ContentGenerationParams): Promise<ContentItem> => {
      setError(null);
      return generateContentMutation.mutateAsync(params);
    },
    [generateContentMutation]
  );

  const updateContent = useCallback(
    async (id: string, updates: Partial<ContentItem>): Promise<ContentItem> => {
      setError(null);
      return updateContentMutation.mutateAsync({ id, updates });
    },
    [updateContentMutation]
  );

  const deleteContent = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await deleteContentMutation.mutateAsync(id); // ✅ Fixes the "Type 'string' is not assignable to type 'void'" error
    },
    [deleteContentMutation]
  );

  const publishToWordPress = useCallback(
    async (contentId: string): Promise<void> => {
      setError(null);
      await publishToWordPressMutation.mutateAsync(contentId);
    },
    [publishToWordPressMutation]
  );

  const getContent = useCallback(
    (id: string): ContentItem | undefined => {
      return contents.find((content) => content.id === id);
    },
    [contents]
  );

  // ✅ New Methods mapping for Component needs
  const getContentAnalytics = async (id: string) => {
    const res = await contentAPI.getAnalytics(id);
    return res.data;
  };

  const scheduleContent = async (data: any) => {
    const res = await schedulerAPI.schedulePost(data);
    return res.data;
  };

  const combinedLoading = isQueryLoading || generateContentMutation.isLoading;

  return {
    contents,
    loading: combinedLoading,
    isLoading: combinedLoading,
    error,
    generateContent,
    createContent: generateContent,
    updateContent,
    saveContent: updateContent,
    updateContentMeta: updateContent,
    deleteContent,
    publishToWordPress,
    getContent,
    getContentById: getContent,
    refreshContents,
    getContentList: refreshContents,
    getContentAnalytics,
    scheduleContent,
  };
};