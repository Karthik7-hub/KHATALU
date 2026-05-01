import { Router } from "express";
import { login, logout, refreshToken, updateProfile } from "../controllers/authController.js";
import verifyFirebaseToken from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/auth/login — unprotected (creates user + sets HTTP-only cookie)
router.post("/login", login);

// POST /api/auth/logout — clears the auth cookie
router.post("/logout", logout);

// POST /api/auth/refresh — protected, rotates the cookie with a fresh token
router.post("/refresh", verifyFirebaseToken, refreshToken);

// PUT /api/auth/update-profile — protected, updates the user's name
router.put("/update-profile", verifyFirebaseToken, updateProfile);

export default router;
