
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PinPost } from '@/contexts/PostsContext';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface PostFormProps {
  data: Partial<PinPost>;
  onChange: (data: Partial<PinPost>) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ data, onChange }) => {
  const [hashtag, setHashtag] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddHashtag = () => {
    if (hashtag.trim() && !data.hashtags?.includes(hashtag.trim())) {
      const newHashtags = [...(data.hashtags || []), hashtag.trim()];
      onChange({ hashtags: newHashtags });
      setHashtag('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    const newHashtags = data.hashtags?.filter((t) => t !== tag) || [];
    onChange({ hashtags: newHashtags });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className={`upload-dropzone ${isDragging ? 'active' : ''} h-60 flex flex-col items-center justify-center cursor-pointer`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {data.image ? (
          <div className="relative w-full h-full">
            <img 
              src={data.image} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-xl" 
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="text-white font-medium">Click to change image</span>
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mb-2 text-gray-400" />
            <p className="text-sm font-medium">Drag and drop an image or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageUpload}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            value={data.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Add a title that describes your pin"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={data.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Tell everyone what your pin is about"
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="link">Destination Link (optional)</Label>
          <Input 
            id="link"
            value={data.link || ''}
            onChange={(e) => onChange({ link: e.target.value })}
            placeholder="Add a link to your website, blog, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags</Label>
          <div className="flex">
            <Input 
              id="hashtags"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="Add hashtags"
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <button 
              type="button" 
              onClick={handleAddHashtag} 
              className="ml-2 px-4 py-2 bg-pin-blue text-white rounded-md"
            >
              Add
            </button>
          </div>
          
          {data.hashtags && data.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                  #{tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveHashtag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
