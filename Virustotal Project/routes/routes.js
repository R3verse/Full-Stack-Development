import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const API_KEY =
  "b932831cfa7e3ded1ffda1d8e478861d826c4792d186e881d751de7ab954616c;"; // Replace with your API key

// Route for uploading files
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../uploads/", req.file.filename);
    const response = await axios.post(
      "https://www.virustotal.com/vtapi/v2/file/scan",
      {
        params: {
          apikey: API_KEY,
          file: fs.createReadStream(filePath),
        },
      }
    );
    const scanId = response.data.scan_id;
    res.redirect(`/results/${scanId}`);
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).send("Error scanning file");
  }
});

// Other routes...
