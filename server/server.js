import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ✅ Tell Express to trust Render's proxy (important for cookies)
app.set("trust proxy", 1);

app.use(cors({
  origin: 'https://loginity-frontend.onrender.com' || 'http://localhost:5173',            // reflect request origin (works like *)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true        // allow cookies/auth headers
}));

app.use(express.json());
app.use(cookieParser());

// API End point
app.get('/', (req, res) => {
  res.send('Hello Satyam from Express!');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter)

app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));