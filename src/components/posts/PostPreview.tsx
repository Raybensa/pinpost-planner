
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PinPost } from '@/contexts/PostsContext';
import { ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface PostPreviewProps {
  post: PinPost;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ post }) => {
  return (
    <div className="flex justify-center py-4">
      <div className="w-[360px] overflow-hidden">
        <Card className="pin-card overflow-hidden bg-white">
          <div className="relative">
            {post.image ? (
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full aspect-[3/4] object-cover" 
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image uploaded</span>
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-medium text-lg mb-2 line-clamp-2">{post.title || 'Untitled Pin'}</h3>
            
            {post.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.description}</p>
            )}
            
            {post.scheduledDate && (
              <div className="flex items-center text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3 mr-1" />
                Scheduled for {format(new Date(post.scheduledDate), 'MMMM d, yyyy')}
              </div>
            )}
            
            {post.link && (
              <a 
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-pin-blue hover:underline mb-3"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {new URL(post.link.startsWith('http') ? post.link : `https://${post.link}`).hostname}
              </a>
            )}
          </CardContent>
          
          {post.hashtags && post.hashtags.length > 0 && (
            <CardFooter className="px-4 pb-4 pt-0 flex flex-wrap gap-1">
              {post.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};
