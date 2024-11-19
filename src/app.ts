import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import companyRoutes from "routes/companyRoutes";
import buildingRoutes from "routes/buildingRoutes";
import floorTypeRoutes from "routes/floorTypeRoutes";
import swaggerMiddleware from "middlewares/swagger-middleware";
import apartmentsRoutes from "routes/apartmentsRoutes";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use("/api", companyRoutes);
app.use("/api", buildingRoutes);
app.use("/api", floorTypeRoutes);
app.use("/api", apartmentsRoutes);
app.use("/api", ...swaggerMiddleware);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
