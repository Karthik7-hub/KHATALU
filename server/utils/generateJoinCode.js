import Room from "../models/Room.js";

/**
 * Generates a unique 6-character alphanumeric join code.
 * Uses uppercase letters and digits (A-Z, 0-9).
 * Retries on collision with existing room codes.
 *
 * @param {number} maxRetries - Maximum collision retries (default 10).
 * @returns {Promise<string>} A unique 6-character join code.
 * @throws {Error} If a unique code cannot be generated within maxRetries.
 */
export async function generateJoinCode(maxRetries = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const CODE_LENGTH = 6;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check for collision
    const existing = await Room.findOne({ joinCode: code });
    if (!existing) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique join code. Please try again.");
}
