
import React from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AccountInfoProps {
  user: User | null;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ user }) => {
  // Get the first letter of the email for the avatar fallback
  const getInitial = (email: string | undefined) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
          <AvatarFallback>{getInitial(user?.email)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </div>
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
  );
};

export default AccountInfo;
