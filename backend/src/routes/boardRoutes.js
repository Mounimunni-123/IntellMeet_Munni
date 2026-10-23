import express from "express";
import {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
} from "../controllers/boardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyBoards);
router.post("/", createBoard);
router.get("/:id", getBoardById);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

router.post("/:id/tasks", createTask);
router.put("/:id/tasks/:taskId", updateTask);
router.patch("/:id/tasks/:taskId/move", moveTask);
router.delete("/:id/tasks/:taskId", deleteTask);

export default router;
