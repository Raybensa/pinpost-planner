
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { usePosts, PinPost } from '@/contexts/PostsContext';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '../posts/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ListFilter } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { posts, getPostsByDate } = usePosts();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  
  // Get all dates with posts for highlighting in the calendar
  const scheduledDates = posts
    .filter(post => post.scheduledDate)
    .map(post => new Date(post.scheduledDate as Date));
  
  // Get posts for the selected date
  const postsForSelectedDate = selectedDate ? getPostsByDate(selectedDate) : [];
  
  // Function to get posts by month for list view
  const getPostsByMonth = () => {
    const postsByMonth: { [key: string]: PinPost[] } = {};
    
    posts.filter(post => post.scheduledDate).forEach(post => {
      const date = new Date(post.scheduledDate as Date);
      const monthKey = format(date, 'MMMM yyyy');
      
      if (!postsByMonth[monthKey]) {
        postsByMonth[monthKey] = [];
      }
      
      postsByMonth[monthKey].push(post);
    });
    
    return postsByMonth;
  };
  
  const postsByMonth = getPostsByMonth();
  
  return (
    <Card className="shadow-sm glass p-0 animate-fade-in">
      <Tabs defaultValue={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
        <div className="p-4 border-b border-border/40 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Scheduled Posts</h2>
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <ListFilter className="h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="calendar" className="m-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 h-full">
              <div className="border-r border-border/40 p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full pointer-events-auto"
                  modifiers={{
                    scheduled: scheduledDates,
                  }}
                  modifiersStyles={{
                    scheduled: {
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      borderRadius: '100%',
                      color: 'hsl(210, 100%, 50%)',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </div>
              
              <div className="md:col-span-1 lg:col-span-2 p-6 overflow-auto max-h-[600px]">
                <h3 className="font-medium mb-4">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </h3>
                
                {postsForSelectedDate.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No posts scheduled for this date</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {postsForSelectedDate.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="m-0 p-6">
            {Object.keys(postsByMonth).length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No posts scheduled</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(postsByMonth).map(([month, monthPosts]) => (
                  <div key={month}>
                    <h3 className="font-medium mb-4 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-pin-blue" />
                      {month}
                      <Badge className="ml-2 bg-pin-blue">{monthPosts.length} posts</Badge>
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {monthPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
