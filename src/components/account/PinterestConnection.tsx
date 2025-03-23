
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LinkIcon, CheckCircle, XCircle } from "lucide-react";

export const PinterestConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  
  useEffect(() => {
    const checkPinterestConnection = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('pinterest_access_token, pinterest_token_expires_at')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        const connected = !!data?.pinterest_access_token;
        setIsConnected(connected);
        
        if (connected && data.pinterest_token_expires_at) {
          setTokenExpiry(new Date(data.pinterest_token_expires_at));
        }
      } catch (error) {
        console.error('Error checking Pinterest connection:', error);
        toast({
          title: "Error",
          description: "Failed to check Pinterest connection status",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkPinterestConnection();
    
    // Also check when the URL has the pinterest_connected parameter
    const url = new URL(window.location.href);
    if (url.searchParams.get('pinterest_connected') === 'true') {
      toast({
        title: "Success!",
        description: "Your Pinterest account has been connected successfully",
      });
      url.searchParams.delete('pinterest_connected');
      window.history.replaceState({}, document.title, url.toString());
    }
    
    // Check for errors
    const pinterestError = url.searchParams.get('pinterest_error');
    if (pinterestError) {
      toast({
        title: "Connection Failed",
        description: decodeURIComponent(pinterestError),
        variant: "destructive"
      });
      url.searchParams.delete('pinterest_error');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [user, toast]);
  
  const connectPinterest = async () => {
    if (!user) return;
    
    try {
      setConnecting(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Call our Pinterest auth edge function to get the auth URL
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/pinterest-auth`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Pinterest authorization URL');
      }
      
      const { url } = await response.json();
      
      // Redirect to Pinterest for authorization
      window.location.href = url;
    } catch (error) {
      console.error('Error connecting to Pinterest:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Pinterest",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };
  
  const disconnectPinterest = async () => {
    if (!user) return;
    
    try {
      setConnecting(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          pinterest_access_token: null,
          pinterest_refresh_token: null,
          pinterest_token_expires_at: null,
          pinterest_board_id: null
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsConnected(false);
      setTokenExpiry(null);
      
      toast({
        title: "Disconnected",
        description: "Your Pinterest account has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting Pinterest:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Pinterest account",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Pinterest Connection
          {isConnected && (
            <Badge className="ml-2 bg-green-500">Connected</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Pinterest account to automatically publish scheduled posts
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Your Pinterest account is connected
            </div>
            {tokenExpiry && (
              <div className="text-sm text-muted-foreground">
                Token expires: {tokenExpiry.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            Not connected to Pinterest
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isConnected ? (
          <Button 
            variant="outline" 
            onClick={disconnectPinterest}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Pinterest'
            )}
          </Button>
        ) : (
          <Button 
            onClick={connectPinterest}
            disabled={connecting}
            className="bg-pin-blue hover:bg-pin-blue/90"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect Pinterest Account
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
