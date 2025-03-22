
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PinPost } from '@/contexts/PostsContext';
import { Badge } from '@/components/ui/badge';
import { Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { PostCreationModal } from './PostCreationModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePosts } from '@/contexts/PostsContext';

interface PostCardProps {
  post: PinPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { deletePost } = usePosts();
  
  return (
    <>
      <Card className="pin-card h-full overflow-hidden animate-scale-in">
        <div className="relative">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full aspect-video object-cover" 
          />
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 cursor-pointer">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this pin post and remove it from your schedule.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-red-500 hover:bg-red-600">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-1">{post.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
          
          {post.scheduledDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(post.scheduledDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </CardContent>
        {post.hashtags.length > 0 && (
          <CardFooter className="px-4 pb-4 pt-0 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.hashtags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{post.hashtags.length - 3}
              </Badge>
            )}
          </CardFooter>
        )}
      </Card>
      
      {isEditOpen && (
        <PostCreationModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={post}
          postId={post.id}
        />
      )}
    </>
  );
};
