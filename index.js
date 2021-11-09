// the server is an express application

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

import movementRoutes from "./routes/movement.js";
import userRoutes from "./routes/user.js";
import bodyStatusRoutes from "./routes/bodyStatus.js";
import planRoutes from "./routes/plan.js";
import sessionRoutes from "./routes/session.js";
import performanceRoutes from "./routes/performance.js";
import goalRoutes from "./routes/goal.js";

dotenv.config();

const server = express();

// middleware

// server.use(bodyParser.json({ limit: "30mb", extended: true }));
// server.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

server.use(express.json({ limit: "30mb", extended: true }));
server.use(express.urlencoded({ limit: "30mb", extended: true }));

server.use(cors());

// routing

server.use("/movements", movementRoutes);
server.use("/users", userRoutes);
server.use("/bodyStatuses", bodyStatusRoutes);
server.use("/plans", planRoutes);
server.use("/sessions", sessionRoutes);
server.use("/performances", performanceRoutes);
server.use("/goals", goalRoutes);

// .env

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 5000;

// mongoose

const EDB = axios.create({
  baseURL: "https://exercisedb.p.rapidapi.com",
  headers: {
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
    "x-rapidapi-key": "0fe601ec97msh3fea4f7f5465370p15768bjsn5313a531d719",
  },
});

export var EDBmovements;

mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    server.listen(PORT, () =>
      console.log(`Otrera server running on port: ${PORT}`)
    )
  )
  .then(() => EDB.get(`/exercises`))
  .then(({ data: EDBmovementsUnsecure }) => {
    console.log(`EDBmovements.length: `, EDBmovementsUnsecure.length);
    EDBmovementsUnsecure = EDBmovementsUnsecure.map((EDBmovement) => {
      const { gifUrl: gifUrlUnsecure } = EDBmovement;
      const indexOfp = gifUrlUnsecure.indexOf("p");
      return {
        ...EDBmovement,
        gifUrl:
          gifUrlUnsecure.slice(0, indexOfp) + "s" + gifUrlUnsecure.slice(indexOfp),
      };
    });
  })
  .catch((error) => console.log(error.message));

mongoose.set("useFindAndModify", false);