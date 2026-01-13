import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import AdmZip from "adm-zip";
import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";
import { chat } from "./agent";
import { loadProjectData } from "./tools";

const app = express();
const PORT = 3001;

// Generate unique ID using built-in crypto
function generateId(): string {
    return crypto.randomBytes(16).toString("hex");
}

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${generateId()}.zip`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
            cb(null, true);
        } else {
            cb(new Error("Only .zip files are allowed"));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
});

app.use(cors());
app.use(express.json());

// Store session data (in production, use Redis or a database)
const sessions: Map<string, string> = new Map();

// Upload endpoint
app.post("/api/upload", upload.single("project"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const sessionId = generateId();
        const zipPath = req.file.path;
        const extractPath = path.join(UPLOADS_DIR, sessionId);
        const jsonPath = path.join(UPLOADS_DIR, `${sessionId}.json`);

        // Extract zip
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Find the Spring Boot project root (look for src/main/java)
        let projectRoot = extractPath;
        const findProjectRoot = (dir: string): string | null => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.name === "src") {
                        const mainJavaPath = path.join(fullPath, "main", "java");
                        if (fs.existsSync(mainJavaPath)) {
                            return dir;
                        }
                    }
                    const found = findProjectRoot(fullPath);
                    if (found) return found;
                }
            }
            return null;
        };

        const foundRoot = findProjectRoot(extractPath);
        if (foundRoot) {
            projectRoot = foundRoot;
        }

        // Run the Java parser
        const { exec } = await import("child_process");
        const jarPath = path.join(__dirname, "..", "..", "springboot-agent", "target", "springboot-analyzer-1.0-SNAPSHOT.jar");

        await new Promise<void>((resolve, reject) => {
            const command = `java -jar "${jarPath}" "${projectRoot}" "${jsonPath}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error("Parser error:", stderr);
                    reject(error);
                    return;
                }
                console.log("Parser output:", stdout);
                resolve();
            });
        });

        // Verify JSON was created
        if (!fs.existsSync(jsonPath)) {
            return res.status(500).json({ error: "Failed to analyze project" });
        }

        // Store session
        sessions.set(sessionId, jsonPath);

        // Load the new project data
        loadProjectData(jsonPath);

        // Clean up zip file
        fs.unlinkSync(zipPath);

        res.json({
            sessionId,
            message: "Project uploaded and analyzed successfully",
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to process upload" });
    }
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // If sessionId provided, load that project's data
        if (sessionId && sessions.has(sessionId)) {
            const jsonPath = sessions.get(sessionId)!;
            loadProjectData(jsonPath);
        }

        const response = await chat(message);
        res.json({ response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 Agent server running on http://localhost:${PORT}`);
});