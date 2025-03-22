
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostForm } from './PostForm';
import { PostPreview } from './PostPreview';
import { PinPost, usePosts } from '@/contexts/PostsContext';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<PinPost>;
  postId?: string;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData,
  postId
}) => {
  const { addPost, updatePost } = usePosts();
  const [activeTab, setActiveTab] = useState('edit');
  const [formData, setFormData] = useState<Partial<Omit<PinPost, 'id' | 'createdAt' | 'status'>>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    link: initialData?.link || '',
    hashtags: initialData?.hashtags || [],
    image: initialData?.image || '',
    scheduledDate: initialData?.scheduledDate || null,
  });
  
  const [date, setDate] = useState<Date | null>(initialData?.scheduledDate || null);

  const handleFormChange = (data: Partial<Omit<PinPost, 'id' | 'createdAt' | 'status'>>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      // Preserve the current time if a date was already set
      if (date) {
        selected.setHours(date.getHours(), date.getMinutes());
      } else {
        // Default to noon if no previous time was set
        selected.setHours(12, 0);
      }
      setDate(selected);
      handleFormChange({ scheduledDate: selected });
    }
  };

  const handleSubmit = () => {
    if (!formData.image) {
      alert("Please upload an image");
      return;
    }
    
    if (!formData.title) {
      alert("Please add a title");
      return;
    }
    
    if (postId) {
      updatePost(postId, formData as Partial<PinPost>);
    } else {
      addPost(formData as Omit<PinPost, 'id' | 'createdAt' | 'status'>);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-semibold flex items-center">
            <Pin className="h-5 w-5 mr-2 text-pin-blue" />
            {postId ? 'Edit Pin Post' : 'Create New Pin Post'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Schedule date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date || undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button onClick={handleSubmit}>
                  {postId ? 'Update' : 'Schedule'} Post
                </Button>
              </div>
            </div>
            
            <TabsContent value="edit" className="mt-0">
              <PostForm 
                data={formData} 
                onChange={handleFormChange} 
              />
            </TabsContent>
            
            <TabsContent value="preview" className="mt-0">
              <PostPreview post={formData as PinPost} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
