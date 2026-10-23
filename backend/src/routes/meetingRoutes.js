import express from "express";
import {
  createMeeting,
  endMeeting,
  getMyMeetings,
  joinMeeting,
  getMeetingDetails,
  uploadMeetingRecording,
  addActionItem,
  toggleActionItem,
  deleteActionItem,
  updateMeetingSummary,
} from "../controllers/meetingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { recordingUpload } from "../config/cloudinary.js";

const router = express.Router();

router.use(protect);

router.post("/create", createMeeting);
router.post("/join", joinMeeting);
router.post(
  "/:code/recording",
  recordingUpload.single("recording"),
  uploadMeetingRecording,
);
router.patch("/:code/end", endMeeting);
router.get("/my-meetings", getMyMeetings);
router.get("/:code", getMeetingDetails);

router.post("/:code/action-items", addActionItem);
router.patch("/:code/action-items/:itemId", toggleActionItem);
router.delete("/:code/action-items/:itemId", deleteActionItem);
router.patch("/:code/summary", updateMeetingSummary);

export default router;
