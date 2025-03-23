
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, LinkIcon } from "lucide-react";

interface PinterestActionButtonProps {
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const PinterestActionButton: React.FC<PinterestActionButtonProps> = ({
  isConnected,
  connecting,
  onConnect,
  onDisconnect
}) => {
  if (isConnected) {
    return (
      <Button 
        variant="outline" 
        onClick={onDisconnect}
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
    );
  }
  
  return (
    <Button 
      onClick={onConnect}
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
  );
};
