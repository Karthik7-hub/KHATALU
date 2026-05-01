import { Router } from "express";
import verifyFirebaseToken from "../middleware/authMiddleware.js";
import { addExpense, deleteExpense } from "../controllers/expenseController.js";

const router = Router();

// All expense routes are protected
router.use(verifyFirebaseToken);

router.post("/", addExpense);
router.delete("/:expenseId", deleteExpense);

export default router;
