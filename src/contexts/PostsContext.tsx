
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  addPost: (post: Omit<PinPost, 'id' | 'createdAt' | 'status'>) => void;
  updatePost: (id: string, updatedPost: Partial<PinPost>) => void;
  deletePost: (id: string) => void;
  getPostsByDate: (date: Date) => PinPost[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

// Sample images for demo purposes
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1613310023042-ad79320c00ff?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074&auto=format&fit=crop',
];

// Sample posts for demo
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

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<PinPost[]>(() => {
    const savedPosts = localStorage.getItem('pinPosts');
    return savedPosts ? JSON.parse(savedPosts) : generateSamplePosts();
  });

  // Save posts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pinPosts', JSON.stringify(posts));
  }, [posts]);

  const addPost = (post: Omit<PinPost, 'id' | 'createdAt' | 'status'>) => {
    const newPost: PinPost = {
      ...post,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: post.scheduledDate ? 'scheduled' : 'draft',
    };
    
    setPosts((prevPosts) => [...prevPosts, newPost]);
    toast.success('Post created successfully');
  };

  const updatePost = (id: string, updatedPost: Partial<PinPost>) => {
    setPosts((prevPosts) => 
      prevPosts.map((post) => 
        post.id === id 
          ? { 
              ...post, 
              ...updatedPost, 
              status: updatedPost.scheduledDate ? 'scheduled' : 'draft'
            } 
          : post
      )
    );
    toast.success('Post updated successfully');
  };

  const deletePost = (id: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
    toast.success('Post deleted successfully');
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
    <PostsContext.Provider value={{ posts, addPost, updatePost, deletePost, getPostsByDate }}>
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
