
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePinterestConnection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);

  useEffect(() => {
    checkPinterestConnection();
    checkUrlParameters();
  }, [user]);

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

  const checkUrlParameters = () => {
    const url = new URL(window.location.href);
    
    // Check for successful connection
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
  };

  const connectPinterest = async () => {
    if (!user) return;
    
    try {
      setConnecting(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Use the absolute URL for the function endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://zoliumvlprgssryecypq.supabase.co'}/functions/v1/pinterest-auth`, {
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

  return {
    isConnected,
    loading,
    connecting,
    tokenExpiry,
    connectPinterest,
    disconnectPinterest
  };
}
