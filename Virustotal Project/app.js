import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import fs from "fs";
import FormData from "form-data"; // Import FormData for handling file uploads

const app = express();

// Hardcoded API key
const VIRUSTOTAL_API_KEY =
  "b932831cfa7e3ded1ffda1d8e478861d826c4792d186e881d751de7ab954616c"; // Your actual API key

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Uploads directory created.");
}

// Rate limiting variables
let requestCount = 0;
let lastResetTime = Date.now();

// Rate limiter middleware
function rateLimiter(req, res, next) {
  const currentTime = Date.now();
  // Reset request count every minute
  if (currentTime - lastResetTime >= 60000) {
    requestCount = 0;
    lastResetTime = currentTime;
  }

  if (requestCount < 4) {
    requestCount++;
    next();
  } else {
    res
      .status(429)
      .send("Too many requests. Please wait a minute and try again.");
  }
}

// Set up EJS for templating
app.set("view engine", "ejs");
app.use(express.static("public")); // Serve static files from the 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the uploads directory created earlier
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original file name
  },
});
const upload = multer({ storage: storage });

// Root route to serve the upload form
app.get("/", (req, res) => {
  res.render("index"); // Render the index EJS template
});

// Route for uploading files to VirusTotal
app.post("/upload", rateLimiter, upload.single("file"), async (req, res) => {
  try {
    // Ensure a file is uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded."); // Return error if no file is present
    }

    const filePath = path.join(uploadsDir, req.file.filename); // Path to the uploaded file
    const formData = new FormData(); // Create a new FormData instance
    formData.append("file", fs.createReadStream(filePath)); // Append the file stream to the form data

    const response = await axios.post(
      "https://www.virustotal.com/vtapi/v2/file/scan",
      formData,
      {
        params: {
          apikey: VIRUSTOTAL_API_KEY, // Use your hardcoded API key here
        },
        headers: {
          "Content-Type": "multipart/form-data", // Use simple multipart/form-data
        },
      }
    );

    console.log("API Response:", response.data); // Log the entire response for debugging

    const scanId = response.data.scan_id; // Extract scan_id from the response
    if (!scanId) {
      throw new Error("Scan ID is undefined."); // Throw an error if scanId is not available
    }

    console.log("Scan ID:", scanId); // Log the scan ID for debugging
    res.redirect(`/results/${scanId}`); // Redirect to results page with scan ID
  } catch (error) {
    console.error(
      "Error uploading file:",
      error.response ? error.response.data : error.message
    ); // Log the error
    res.status(500).send("Error scanning file"); // Send error response
  }
});

// Route for scanning a URL
app.post("/scan-url", rateLimiter, async (req, res) => {
  const urlToScan = req.body.url; // Get the URL from the request body
  try {
    const response = await axios.post(
      "https://www.virustotal.com/vtapi/v2/url/scan",
      null,
      {
        params: {
          apikey: VIRUSTOTAL_API_KEY, // Use your hardcoded API key here
          url: urlToScan,
        },
      }
    );

    console.log("URL Scan API Response:", response.data); // Log the entire response for debugging

    const scanId = response.data.scan_id; // Extract scan_id from the response
    if (!scanId) {
      throw new Error("Scan ID is undefined."); // Throw an error if scanId is not available
    }

    console.log("URL Scan ID:", scanId); // Log the scan ID for debugging
    res.redirect(`/results/${scanId}`); // Redirect to results page with scan ID
  } catch (error) {
    console.error("Error scanning URL:", error.message); // Log the error
    res.status(500).send("Error scanning URL"); // Send error response
  }
});

// Route to display results
app.get("/results/:scanId", async (req, res) => {
  const scanId = req.params.scanId;
  try {
    const response = await axios.get(
      "https://www.virustotal.com/vtapi/v2/file/report",
      {
        params: {
          apikey: VIRUSTOTAL_API_KEY, // Use your hardcoded API key here
          resource: scanId, // Use scanId as resource to get results
        },
      }
    );

    // Check if the scan is completed
    if (response.data.response_code === 1) {
      // response_code 1 means the report is available
      res.render("results", { results: response.data }); // Pass the data as 'results'
    } else {
      // If the scan is not complete, you can inform the user
      res.send("Scan not complete yet. Please wait and check again later.");
    }
  } catch (error) {
    console.error(
      "Error fetching results:",
      error.response ? error.response.data : error.message
    ); // Log the detailed error
    res.status(500).send("Error fetching results"); // Send error response
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
