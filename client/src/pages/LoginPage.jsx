import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/rooms", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/rooms");
    } catch (error) {
      // Handled in context via toast
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="app-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <img src="/logo.png" alt="Khatalu logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px" }} />
        </motion.div>
        
        <div className="login-titles">
          <h1 className="login-title">Khatalu</h1>
          <p className="login-subtitle">
            Track shared expenses, split bills, and settle debts — together.
          </p>
        </div>

        <motion.button
          onClick={handleLogin}
          disabled={loading}
          className="google-btn"
          whileTap={{ scale: 0.97 }}
        >
          <FcGoogle size={24} />
          {loading ? "Authenticating..." : "Continue with Google"}
        </motion.button>

        <div className="login-footer">
          <HiOutlineShieldCheck size={16} />
          Secure Auth via Firebase
        </div>
      </motion.div>
    </div>
  );
}
