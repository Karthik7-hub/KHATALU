import { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import api from "../config/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount (display data only — no token)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get a fresh Firebase ID token
          const idToken = await firebaseUser.getIdToken(true);

          // Send to backend — backend sets it as an HTTP-only cookie
          const response = await api.post("/auth/login", {
            firebaseToken: idToken,
          });

          const backendUser = response.data.user;
          setUser(backendUser);
          localStorage.setItem("user", JSON.stringify(backendUser));
        } catch (error) {
          console.error("Backend login failed:", error);
          // Keep user from localStorage if backend is temporarily down
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Token refresh: every 50 minutes, get a fresh Firebase token
   * and send it to the backend's /auth/refresh endpoint.
   * The backend rotates the HTTP-only cookie with the new token.
   *
   * The token never touches localStorage — it goes straight
   * from Firebase SDK → backend → HTTP-only cookie.
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          await api.post("/auth/refresh", { firebaseToken: idToken });
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);

      // Step 1: Firebase handles the Google OAuth popup (client-side only)
      const result = await signInWithPopup(auth, googleProvider);

      // Step 2: Get the cryptographic ID token
      const idToken = await result.user.getIdToken();

      // Step 3: Send to backend — backend verifies with Admin SDK
      //         and sets an HTTP-only cookie (not accessible to JS)
      const response = await api.post("/auth/login", {
        firebaseToken: idToken,
      });

      const backendUser = response.data.user;
      setUser(backendUser);
      // Only store non-sensitive display data in localStorage
      localStorage.setItem("user", JSON.stringify(backendUser));

      toast.success(`Welcome, ${backendUser.name}!`);
      return backendUser;
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Step 1: Tell backend to clear the HTTP-only cookie
      await api.post("/auth/logout");

      // Step 2: Sign out of Firebase (clears client-side session)
      await signOut(auth);

      // Step 3: Clear non-sensitive display data
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("currentRoomId");

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if backend call fails
      await signOut(auth);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("currentRoomId");
      toast.error("Logout failed");
    }
  };

  const updateProfile = async (name) => {
    try {
      const response = await api.put("/auth/update-profile", { name });
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success(response.data.message || "Profile updated");
      return updatedUser;
    } catch (error) {
      console.error("Update profile failed:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
      throw error;
    }
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
