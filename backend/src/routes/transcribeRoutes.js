import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import { transcriptionService } from "../services/transcriptionService.js";

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

router.post("/", protect, upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const tempPath = `${req.file.path}.webm`;

  try {
    await fs.promises.rename(req.file.path, tempPath);
    
    const text = await transcriptionService.transcribe(tempPath);
    res.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlink(tempPath, (err) => {
        if (err) console.error("Failed to delete temp audio file:", err);
      });
    }
  }
});

export default router;
