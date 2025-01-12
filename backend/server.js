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
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './lib/socket.js';
import messageRouter from './routes/message/message_route.js';
import jwt from 'jsonwebtoken';

dotenv.config();
await connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'https://sociostackng.vercel.app',
            'http://localhost:3000'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
});

// Setup Socket.IO with authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        console.error('Socket auth error:', err);
        next(new Error('Authentication error: Invalid token'));
    }
});

setupSocket(io);

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
app.set('io', io);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API routes
app.use("/api/auth", auth_router);
app.use("/api/user", user_router);
app.use("/api/post", post_router);
app.use("/api/notif", notif_router);
app.use('/api/message', messageRouter);

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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
