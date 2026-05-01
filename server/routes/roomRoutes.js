import { Router } from "express";
import verifyFirebaseToken from "../middleware/authMiddleware.js";
import {
  createRoom,
  joinRoom,
  getDashboard,
  getMyRooms,
  leaveRoom,
  removeMember,
  deleteRoom,
} from "../controllers/roomController.js";

const router = Router();

// All room routes are protected
router.use(verifyFirebaseToken);

router.post("/create", createRoom);
router.post("/join", joinRoom);
router.get("/my-rooms", getMyRooms);
router.get("/:roomId/dashboard", getDashboard);
router.post("/:roomId/leave", leaveRoom);
router.delete("/:roomId/member/:memberId", removeMember);
router.delete("/:roomId", deleteRoom);

export default router;
