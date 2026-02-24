/* eslint-disable react-refresh/only-export-components */
import React, {
  useCallback,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileSafe = async (role, userId) => {
    try {
      const profileRes = await fetch(
        `/api/${role}/profile?userId=${encodeURIComponent(userId)}`
      );

      if (!profileRes.ok) {
        console.warn(
          `Profile fetch failed for role=${role}, userId=${userId}, status=${profileRes.status}`
        );
        return null;
      }

      return await profileRes.json();
    } catch (error) {
      console.warn("Profile fetch request failed:", error);
      return null;
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const response = await fetch(`/api/auth/validate`, {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          mode: "cors",
        });

        if (!response.ok) throw new Error("Token validation failed");
        const validationData = await response.json();

        if (validationData.valid) {
          const user = validationData.user;
          const userId = user.user_id;
          const role = user.role;

          // Only fetch profile if not included in validationData
          let profileData = validationData.profile || null;
          if (!profileData) {
            profileData = await fetchProfileSafe(role, userId);
          }

          const userData = { ...user, ...(profileData || {}) };
          setCurrentUser(userData);
          setUserRole(role);
        } else {
          localStorage.removeItem("authToken");
          setCurrentUser(null);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error("Auth validation error:", error);
      localStorage.removeItem("authToken");
      setCurrentUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (userId, password, role) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const { token, user, profile } = await response.json();
      const canonicalUserId = user?.user_id || userId;

      let profileData = profile;
      if (!profileData) {
        profileData = await fetchProfileSafe(user.role, canonicalUserId);
      }

      const userData = { ...user, ...(profileData || {}) };
      localStorage.setItem("authToken", token);
      setCurrentUser(userData);
      setUserRole(user.role);

      return { success: true, role: user.role };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  }, []);

  // Logout does not need to be async
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setCurrentUser(null);
    setUserRole(null);
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      currentUser,
      userRole,
      loading,
      login,
      logout,
      checkAuth,
    }),
    [currentUser, userRole, loading, login, logout, checkAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
