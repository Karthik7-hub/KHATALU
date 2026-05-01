import { Router } from "express";
import verifyFirebaseToken from "../middleware/authMiddleware.js";
import { createCategory, getCategories, updateCategory } from "../controllers/categoryController.js";

const router = Router();

router.use(verifyFirebaseToken);

router.post("/", createCategory);
router.get("/:roomId", getCategories);
router.put("/:categoryId", updateCategory);

export default router;
