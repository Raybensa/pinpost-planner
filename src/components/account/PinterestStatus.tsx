
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface PinterestStatusProps {
  isConnected: boolean;
  tokenExpiry: Date | null;
}

export const PinterestStatus: React.FC<PinterestStatusProps> = ({ 
  isConnected, 
  tokenExpiry 
}) => {
  return (
    <div className="flex flex-col gap-2">
      {isConnected ? (
        <>
          <div className="flex items-center text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Your Pinterest account is connected
          </div>
          {tokenExpiry && (
            <div className="text-sm text-muted-foreground">
              Token expires: {tokenExpiry.toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center text-sm text-muted-foreground">
          <XCircle className="h-4 w-4 text-red-500 mr-2" />
          Not connected to Pinterest
        </div>
      )}
    </div>
  );
};
