
import React from 'react';
import { PinterestConnection } from '@/components/account/PinterestConnection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        
        <Button variant="outline" onClick={signOut} className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-medium text-sm">Email</h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">User ID</h3>
                <p className="text-muted-foreground text-xs">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <PinterestConnection />
        
        <Card>
          <CardHeader>
            <CardTitle>Pinterest API Usage</CardTitle>
            <CardDescription>
              Monitor your Pinterest API usage to avoid rate limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pinterest has API rate limits that restrict the number of calls per hour. 
              The system automatically tracks your usage and will pause publishing when 
              approaching limits to avoid errors.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
