// the server is an express application

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// routes

import movementRoutes from "./routes/movement.js";
import userRoutes from "./routes/user.js";
import bodyStatusRoutes from "./routes/bodyStatus.js";
import planRoutes from "./routes/plan.js";
import sessionRoutes from "./routes/session.js";
import performanceRoutes from "./routes/performance.js";
import goalRoutes from "./routes/goal.js";

// models

import Movement from "./models/movement.model.js";

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
    EDBmovements = EDBmovementsUnsecure.map((EDBmovement) => {
      const { gifUrl: gifUrlUnsecure } = EDBmovement;
      const indexOfp = gifUrlUnsecure.indexOf("p");
      return {
        ...EDBmovement,
        gifUrl:
          gifUrlUnsecure.slice(0, indexOfp + 1) + "s" + gifUrlUnsecure.slice(indexOfp + 1),
      };
    });
  })
  .then(() => Movement.findOne())
  .then((movementCollectionExists) => {
    const saveNewMovement = async (EDBmovement) => {
      // save a movement document to mdb
      const newMovement = new Movement({
        EDB: EDBmovement.id,
        title: EDBmovement.name,
        targets: [EDBmovement.target],
        bodyPart: EDBmovement.bodyPart,
        equipment: [EDBmovement.equipment],
        image: EDBmovement.gifUrl,
        source: "https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb/",
      });
      newMovement.save();
      return;
    };
    const promises = EDBmovements.map(async (EDBmovement) => {
      if (!movementCollectionExists) {
        saveNewMovement(EDBmovement);
        return;
      }
      const movementDocumentExists = await Movement.findOne({ EDB: EDBmovement.id });
      if (!movementDocumentExists) {
        saveNewMovement(EDBmovement);
        return;
      }
    });
    Promise.all(
      promises
    );
  })
  .then(() => Movement.find())
  .then((foundMovements) => console.log(`movement documents: `, foundMovements.length))
  .catch((error) => console.log(error.message));

mongoose.set("useFindAndModify", false);