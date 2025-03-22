
import React from 'react';
import { PinPost } from '@/contexts/PostsContext';
import { PostCard } from './PostCard';

interface PostGridProps {
  posts: PinPost[];
  emptyMessage?: string;
}

export const PostGrid: React.FC<PostGridProps> = ({ posts, emptyMessage = "No posts to display" }) => {
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
