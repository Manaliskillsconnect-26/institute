import "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./Routes/index.js";
import session from "express-session";
import cookieParser from "cookie-parser";




dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.get("/debug/cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers
  });
});


app.use(cors({
  origin: true,
  credentials: true
}));

app.use(session({
  name: "skillsconnect.sid",
  secret: "skillsconnect_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,  
     sameSite: "lax",      // localhost
    maxAge: 1000 * 60 * 30
  }
}));

app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
