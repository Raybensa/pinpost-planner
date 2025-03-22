
import { CalendarDays, Grid, Home, Image, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { PostCreationModal } from '../posts/PostCreationModal';

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    icon: Home,
    path: '/',
  },
  {
    title: 'Dashboard',
    icon: Grid,
    path: '/dashboard',
  },
  {
    title: 'Calendar',
    icon: CalendarDays,
    path: '/calendar',
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  return (
    <>
      <Sidebar className="border-r border-border/40">
        <SidebarHeader className="p-6">
          <div className="flex items-center space-x-2">
            <Image className="h-6 w-6 text-pin-blue" />
            <h1 className="text-xl font-semibold tracking-tight">PinPost</h1>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="p-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  location.pathname === item.path 
                    ? 'bg-pin-blue text-white' 
                    : 'text-foreground hover:bg-accent'
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </nav>
          
          <div className="mt-8">
            <Button 
              onClick={() => setIsCreationModalOpen(true)}
              className="w-full bg-pin-blue hover:bg-pin-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t border-border/40">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2023 PinPost</p>
            <SidebarTrigger />
          </div>
        </SidebarFooter>
      </Sidebar>
      
      <PostCreationModal 
        isOpen={isCreationModalOpen} 
        onClose={() => setIsCreationModalOpen(false)}
      />
    </>
  );
}
