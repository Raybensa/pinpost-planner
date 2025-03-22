
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-white p-6">
      <div className="text-center glass rounded-2xl p-10 max-w-md animate-fade-in">
        <h1 className="text-6xl font-bold text-pin-blue mb-4">404</h1>
        <p className="text-2xl font-medium mb-6">Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => window.location.href = '/'} className="bg-pin-blue hover:bg-pin-blue/90">
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
