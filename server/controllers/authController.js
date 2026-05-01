import admin from "firebase-admin";
import User from "../models/User.js";

/**
 * Cookie configuration for the auth token.
 *
 * httpOnly: true  → JS cannot read it (prevents XSS token theft)
 * secure: true    → Only sent over HTTPS (in production)
 * sameSite: "lax" → Prevents CSRF while allowing top-level navigations
 * maxAge: 55 min  → Slightly under Firebase's 60-min token lifetime
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 55 * 60 * 1000, // 55 minutes
  path: "/",
});

/**
 * POST /api/auth/login
 *
 * Verifies a Firebase ID token and finds-or-creates the corresponding
 * MongoDB user document. Sets the token as an HTTP-only cookie so that
 * subsequent requests are authenticated without exposing the token to JS.
 */
export const login = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: "Firebase token is required" });
    }

    // Verify the Firebase ID token server-side
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    const { uid, name, email, picture } = decodedToken;

    // Use findOneAndUpdate with upsert to prevent duplicate key errors during concurrent requests
    const user = await User.findOneAndUpdate(
      { googleId: uid },
      {
        $setOnInsert: { email: email || "" },
        $set: {
          name: name || email?.split("@")[0] || "User",
          avatarUrl: picture || "",
        },
      },
      { new: true, upsert: true }
    );

    // Set the Firebase token as an HTTP-only cookie
    res.cookie("authToken", firebaseToken, getCookieOptions());

    return res.status(200).json({
      user: {
        _id: user._id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie server-side.
 */
export const logout = async (_req, res) => {
  try {
    res.clearCookie("authToken", getCookieOptions());
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * POST /api/auth/refresh
 *
 * Accepts a fresh Firebase token (from the client's onAuthStateChanged)
 * and updates the HTTP-only cookie. The client calls this periodically
 * to keep the cookie fresh before the 60-min Firebase token expires.
 */
export const refreshToken = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: "Firebase token is required" });
    }

    // Verify the new token is actually valid
    await admin.auth().verifyIdToken(firebaseToken);

    // Update the cookie with the fresh token
    res.cookie("authToken", firebaseToken, getCookieOptions());

    return res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Token refresh error:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
