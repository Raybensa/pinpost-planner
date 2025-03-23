
import React, { useState, useEffect } from 'react';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PostGrid } from '@/components/posts/PostGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, ListFilter, Plus, Search, RefreshCw, LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PostCreationModal } from '@/components/posts/PostCreationModal';
import { toast } from 'sonner';

const Dashboard = () => {
  const { posts, refreshPosts } = usePosts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isPinterestConnected, setIsPinterestConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check Pinterest connection status
  useEffect(() => {
    const checkPinterestConnection = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('pinterest_access_token')
          .eq('id', user.id)
          .single();
        
        setIsPinterestConnected(!!data?.pinterest_access_token);
      } catch (error) {
        console.error('Error checking Pinterest connection:', error);
      }
    };
    
    checkPinterestConnection();
  }, [user]);
  
  // Handle refreshing posts
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPosts();
    setIsRefreshing(false);
    toast.success('Posts refreshed');
  };
  
  // Filter posts by status and search term
  const filterPosts = (status: 'all' | 'draft' | 'scheduled' | 'published') => {
    let filtered = posts;
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(post => post.status === status);
    }
    
    // Apply text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(term) || 
        post.description?.toLowerCase().includes(term) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Apply additional status filters if any
    if (statusFilter.length > 0) {
      filtered = filtered.filter(post => statusFilter.includes(post.status));
    }
    
    // Sort posts
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Count posts by status
  const draftCount = posts.filter(post => post.status === 'draft').length;
  const scheduledCount = posts.filter(post => post.status === 'scheduled').length;
  const publishedCount = posts.filter(post => post.status === 'published').length;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h1 className="text-3xl font-bold">Post Dashboard</h1>
        
        <div className="flex gap-2">
          {!isPinterestConnected && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/settings'}
              className="flex items-center text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect Pinterest
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => setIsCreationModalOpen(true)}
            className="bg-pin-blue hover:bg-pin-blue/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search posts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                Filter
                {statusFilter.length > 0 && (
                  <Badge className="bg-pin-blue ml-1 h-5 px-1">{statusFilter.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('draft')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'draft'] 
                      : prev.filter(s => s !== 'draft')
                  );
                }}
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('scheduled')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'scheduled'] 
                      : prev.filter(s => s !== 'scheduled')
                  );
                }}
              >
                Scheduled
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('published')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'published'] 
                      : prev.filter(s => s !== 'published')
                  );
                }}
              >
                Published
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {sortBy === 'newest' ? 'Newest' : 'Oldest'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={sortBy === 'newest'}
                onCheckedChange={() => setSortBy('newest')}
              >
                Newest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'oldest'}
                onCheckedChange={() => setSortBy('oldest')}
              >
                Oldest First
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-transparent p-0 space-x-2">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-pin-blue data-[state=active]:text-white"
          >
            All Posts
            <Badge className="ml-2 bg-gray-200 text-gray-800">{posts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="draft"
            className="data-[state=active]:bg-pin-blue data-[state=active]:text-white"
          >
            Drafts
            <Badge className="ml-2 bg-gray-200 text-gray-800">{draftCount}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="scheduled"
            className="data-[state=active]:bg-pin-blue data-[state=active]:text-white"
          >
            Scheduled
            <Badge className="ml-2 bg-gray-200 text-gray-800">{scheduledCount}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="published"
            className="data-[state=active]:bg-pin-blue data-[state=active]:text-white"
          >
            Published
            <Badge className="ml-2 bg-gray-200 text-gray-800">{publishedCount}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <PostGrid 
            posts={filterPosts('all')} 
            emptyMessage={searchTerm ? "No posts match your search" : "No posts available"}
          />
        </TabsContent>
        
        <TabsContent value="draft">
          <PostGrid 
            posts={filterPosts('draft')} 
            emptyMessage={searchTerm ? "No drafts match your search" : "No drafts available"}
          />
        </TabsContent>
        
        <TabsContent value="scheduled">
          <PostGrid 
            posts={filterPosts('scheduled')} 
            emptyMessage={searchTerm ? "No scheduled posts match your search" : "No scheduled posts available"}
          />
        </TabsContent>
        
        <TabsContent value="published">
          <PostGrid 
            posts={filterPosts('published')} 
            emptyMessage={searchTerm ? "No published posts match your search" : "No published posts available"}
          />
        </TabsContent>
      </Tabs>
      
      <PostCreationModal 
        isOpen={isCreationModalOpen} 
        onClose={() => setIsCreationModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
