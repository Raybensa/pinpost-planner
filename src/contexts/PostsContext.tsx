
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';

export interface PinPost {
  id: string;
  title: string;
  description: string;
  link?: string;
  hashtags: string[];
  image: string;
  scheduledDate: Date | null;
  createdAt: Date;
  status: 'draft' | 'scheduled' | 'published';
}

interface PostsContextType {
  posts: PinPost[];
  loading: boolean;
  error: Error | null;
  addPost: (post: Omit<PinPost, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updatePost: (id: string, updatedPost: Partial<PinPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPostsByDate: (date: Date) => PinPost[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

// Sample images for demo purposes when no user is logged in
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1613310023042-ad79320c00ff?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074&auto=format&fit=crop',
];

// Sample posts for demo when no user is logged in
const generateSamplePosts = (): PinPost[] => {
  return [
    {
      id: '1',
      title: 'Minimal workspace design',
      description: 'Clean and minimal workspace setup for maximum productivity',
      link: 'https://example.com/workspace',
      hashtags: ['workspace', 'minimal', 'design', 'productivity'],
      image: SAMPLE_IMAGES[0],
      scheduledDate: new Date(Date.now() + 3600000 * 24 * 2), // 2 days from now
      createdAt: new Date(),
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Morning coffee ritual',
      description: 'Start your day with a perfect cup of artisan coffee',
      link: 'https://example.com/coffee',
      hashtags: ['coffee', 'morning', 'ritual', 'lifestyle'],
      image: SAMPLE_IMAGES[1],
      scheduledDate: new Date(Date.now() + 3600000 * 24 * 5), // 5 days from now
      createdAt: new Date(),
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Minimalist living room',
      description: 'Less is more: creating space for what matters',
      hashtags: ['interior', 'minimal', 'design', 'living'],
      image: SAMPLE_IMAGES[2],
      scheduledDate: null,
      createdAt: new Date(),
      status: 'draft',
    },
  ];
};

// Convert database post to frontend post
const dbPostToFrontend = (post: any): PinPost => {
  return {
    id: post.id,
    title: post.title,
    description: post.description || '',
    link: post.link || '',
    hashtags: post.hashtags || [],
    image: post.image,
    scheduledDate: post.scheduled_date ? new Date(post.scheduled_date) : null,
    createdAt: new Date(post.created_at),
    status: post.status,
  };
};

// Convert frontend post to database format
const frontendPostToDb = (post: Omit<PinPost, 'id' | 'createdAt' | 'status'> | Partial<PinPost>) => {
  const dbPost: {
    title?: string;
    description?: string;
    link?: string;
    hashtags?: string[];
    image?: string;
    scheduled_date?: string | null;
    status?: 'draft' | 'scheduled' | 'published';
  } = {};
  
  if ('title' in post) dbPost.title = post.title;
  if ('description' in post) dbPost.description = post.description;
  if ('link' in post) dbPost.link = post.link;
  if ('hashtags' in post) dbPost.hashtags = post.hashtags;
  if ('image' in post) dbPost.image = post.image;
  
  // Convert Date object to ISO string for Supabase
  if ('scheduledDate' in post) {
    dbPost.scheduled_date = post.scheduledDate ? post.scheduledDate.toISOString() : null;
    // Set status based on scheduled date
    dbPost.status = post.scheduledDate ? 'scheduled' : 'draft';
  }
  
  return dbPost;
};

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<PinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check for user and load posts
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser || null);
        
        if (currentUser) {
          fetchPosts();
        } else {
          // Use sample posts when no user is logged in
          setPosts(generateSamplePosts());
          setLoading(false);
        }
      }
    );
    
    // Initial check for user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user;
      setUser(currentUser || null);
      
      if (currentUser) {
        fetchPosts();
      } else {
        // Use sample posts when no user is logged in
        setPosts(generateSamplePosts());
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pin_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedPosts: PinPost[] = data.map(dbPostToFrontend);
      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (post: Omit<PinPost, 'id' | 'createdAt' | 'status'>) => {
    try {
      if (!user) {
        // When not logged in, just add to local state
        const newPost: PinPost = {
          ...post,
          id: Date.now().toString(),
          createdAt: new Date(),
          status: post.scheduledDate ? 'scheduled' : 'draft',
        };
        
        setPosts(prevPosts => [...prevPosts, newPost]);
        toast.success('Post created successfully');
        return;
      }
      
      const dbPost = frontendPostToDb(post);
      
      // Add status directly here to fix TypeScript error
      const postData = {
        ...dbPost,
        title: post.title,
        image: post.image,
        status: post.scheduledDate ? 'scheduled' : 'draft'
      };
      
      const { data, error } = await supabase
        .from('pin_posts')
        .insert(postData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const newPost = dbPostToFrontend(data);
      setPosts(prevPosts => [...prevPosts, newPost]);
      
      toast.success('Post created successfully');
    } catch (err: any) {
      console.error('Error adding post:', err);
      toast.error('Failed to create post');
    }
  };

  const updatePost = async (id: string, updatedPost: Partial<PinPost>) => {
    try {
      if (!user) {
        // When not logged in, just update local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === id 
              ? { 
                  ...post, 
                  ...updatedPost, 
                  status: 'scheduledDate' in updatedPost 
                    ? (updatedPost.scheduledDate ? 'scheduled' : 'draft') 
                    : post.status
                } 
              : post
          )
        );
        toast.success('Post updated successfully');
        return;
      }
      
      const dbPost = frontendPostToDb(updatedPost);
      
      const { error } = await supabase
        .from('pin_posts')
        .update(dbPost)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === id 
            ? { 
                ...post, 
                ...updatedPost, 
                status: 'scheduledDate' in updatedPost 
                  ? (updatedPost.scheduledDate ? 'scheduled' : 'draft') 
                  : post.status
              } 
            : post
        )
      );
      
      toast.success('Post updated successfully');
    } catch (err: any) {
      console.error('Error updating post:', err);
      toast.error('Failed to update post');
    }
  };

  const deletePost = async (id: string) => {
    try {
      if (!user) {
        // When not logged in, just update local state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
        toast.success('Post deleted successfully');
        return;
      }
      
      const { error } = await supabase
        .from('pin_posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
      toast.success('Post deleted successfully');
    } catch (err: any) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  // Helper function to get posts for a specific date
  const getPostsByDate = (date: Date): PinPost[] => {
    return posts.filter((post) => {
      if (!post.scheduledDate) return false;
      
      const postDate = new Date(post.scheduledDate);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <PostsContext.Provider value={{ 
      posts, 
      loading, 
      error, 
      addPost, 
      updatePost, 
      deletePost,
      getPostsByDate 
    }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};
