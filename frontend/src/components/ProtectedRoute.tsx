import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: "STUDENT" | "FACULTY" | "MENTOR";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Accept both MENTOR and FACULTY for backward compatibility
    if (requiredRole) {
        const userRole = user?.role;
        const normalizedRequired = requiredRole === "MENTOR" ? "FACULTY" : requiredRole;
        const normalizedUser = userRole === "MENTOR" ? "FACULTY" : userRole;
        if (normalizedUser !== normalizedRequired) {
            return <Navigate to={normalizedUser === "FACULTY" ? "/mentor" : "/dashboard"} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
