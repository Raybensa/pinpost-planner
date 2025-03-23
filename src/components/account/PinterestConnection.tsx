
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { usePinterestConnection } from "@/hooks/usePinterestConnection";
import { PinterestStatus } from "./PinterestStatus";
import { PinterestActionButton } from "./PinterestActionButton";

export const PinterestConnection = () => {
  const {
    isConnected,
    loading,
    connecting,
    tokenExpiry,
    connectPinterest,
    disconnectPinterest
  } = usePinterestConnection();
  
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
        <PinterestStatus 
          isConnected={isConnected} 
          tokenExpiry={tokenExpiry} 
        />
      </CardContent>
      
      <CardFooter>
        <PinterestActionButton
          isConnected={isConnected}
          connecting={connecting}
          onConnect={connectPinterest}
          onDisconnect={disconnectPinterest}
        />
      </CardFooter>
    </Card>
  );
};
