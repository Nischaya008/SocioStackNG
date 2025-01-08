import express from "express";
import dotenv from "dotenv";
import auth_router from "./routes/auth/auth_router.js";
import user_router from "./routes/user/user_router.js";
import post_router from "./routes/post/post_router.js";
import notif_router from "./routes/notif/notif_router.js";
import {connectDB} from "./db.js";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors({
    origin: [
        'https://sociostackng.vercel.app',
        'https://sociostackng-re0loosmo-nischaya-gargs-projects.vercel.app',
        'http://localhost:3000',
        'https://github.com/Nischaya008/Image_hosting/blob/main/SSN.gif?raw=true'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API routes
app.use("/api/auth", auth_router);
app.use("/api/user", user_router);
app.use("/api/post", post_router);
app.use("/api/notif", notif_router);

// Serve static files from the React frontend app
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
    app.use(express.static(frontendBuildPath));

    // Handles any requests that don't match the ones above
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server Started at ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();

export default app;