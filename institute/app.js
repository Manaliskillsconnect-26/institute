import "./config/db.js";   

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./Routes/index.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
