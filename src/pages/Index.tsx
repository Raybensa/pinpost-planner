
import React, { useState } from 'react';
import { usePosts } from '@/contexts/PostsContext';
import { PostCreationModal } from '@/components/posts/PostCreationModal';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Image, Pin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PostGrid } from '@/components/posts/PostGrid';

const Index = () => {
  const { posts } = usePosts();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  const recentPosts = [...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 4);
  
  return (
    <div className="space-y-10 animate-fade-in">
      <section className="text-center space-y-6 py-10">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pin-lightBlue text-pin-blue text-sm font-medium mb-2">
          <Pin className="h-4 w-4 mr-1.5" />
          Pinterest Post Scheduler
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Create and Schedule Your <br className="hidden md:inline" />
          <span className="text-pin-blue">Pinterest Posts</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload, design, and schedule your Pinterest content all in one place. 
          Plan your social media strategy with our intuitive scheduler.
        </p>
        
        <Button 
          onClick={() => setIsCreationModalOpen(true)}
          size="lg"
          className="mt-4 bg-pin-blue hover:bg-pin-blue/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Post
        </Button>
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Recent Posts</h2>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            View All
          </Button>
        </div>
        
        {posts.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-pin-lightBlue flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-pin-blue" />
              </div>
              <h3 className="text-xl font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start creating and scheduling your Pinterest posts to see them here
              </p>
              <Button 
                onClick={() => setIsCreationModalOpen(true)}
                className="bg-pin-blue hover:bg-pin-blue/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PostGrid posts={recentPosts} />
        )}
      </section>
      
      <PostCreationModal 
        isOpen={isCreationModalOpen} 
        onClose={() => setIsCreationModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
