import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import os from "os";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import checkAuth, { errorsMessage } from "./utils/checkAuth.js";
import { registerValidation, loginValidation } from "./validations/auth.js";
import handleValidationError from "./utils/handleValidationError.js";
import { postCreateValidation } from "./validations/post.js";
import {
  registerAndCheckAdmin,
  login,
  getMe,
  getUsers,
  checkAdmin,
  createResetPassword,
  updatePassword,
  confirmAdminUser,
} from "./controller/UserController.js";
import {
  createPost,
  getPosts,
  getPostByIdAndUpdateViewsCount,
  removePost,
  updatePost,
  getLastTags,
} from "./controller/PostController.js";
import {
  addMaterial,
  getMaterials,
  getPaginatedMaterials,
  updateMaterial,
  searchMaterialStr,
  getMaterialsById,
} from "./controller/MaterialController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverStartTime = new Date();
const app = express();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB OK"))
  .catch((err) => console.log("error db", err));

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

/* USER */

// register and check admin
app.post(
  "/auth/register",
  registerValidation,
  handleValidationError,
  registerAndCheckAdmin
);

app.post("/auth/confirm", checkAuth, confirmAdminUser);

// login
app.post("/auth/login", loginValidation, handleValidationError, login);

// get user me
app.get("/auth/me", checkAuth, getMe);

// get users
app.get("/users", getUsers);

// check admin
app.post("/check-admin", checkAuth, checkAdmin);

// create reset password token
app.post("/add-reset-password", checkAuth, createResetPassword);

app.post("/update-password", updatePassword);

/* uploads */
app.post("/uploads", checkAuth, upload.single("image"), (req, res) => {
  try {
    res.json({
      message: "Файл загружен успешно",
      url: `/uploads/${req.file.originalname}`,
    });
  } catch (error) {
    errorsMessage(error, res, "ошибка загрузки картинки", 500);
  }
});

/*      POSTS       */

// get all posts method
app.get("/posts", checkAuth, getPosts);

// get post by ID method
app.get("/posts/:id", checkAuth, getPostByIdAndUpdateViewsCount);

// create post method
app.post("/posts", checkAuth, postCreateValidation, createPost);

// delete post method
app.delete("/posts/:id", checkAuth, removePost);

// update post method
app.patch("/posts/:id", checkAuth, updatePost);

/* tags */

app.get("/tags", checkAuth, getLastTags);

/* Material */

app.get("/materials", getMaterials);

app.get("/materials/:id", getMaterialsById);

app.get("/materials-paginated", getPaginatedMaterials);

app.post("/materials/add", addMaterial);

app.post("/materials/search", searchMaterialStr);

app.put("/materials/:id", updateMaterial);

const IPv4 = os.networkInterfaces();

const enternat2 =
  IPv4["Ethernet 2"] === undefined ? null : IPv4["Ethernet 2"][1]?.address;

const enternat4 =
  IPv4["Ethernet 4"] === undefined ? null : IPv4["Ethernet 4"][1]?.address;

// frontend part
app.get("", (req, res) => {
  const uptime = Math.floor(process.uptime());
  const filePath = path.join(__dirname, "public", "status.html");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Ошибка загрузки HTML файла");
      return;
    }

    const htmlWithDynamicData = data
      .replace("Будет передана сервером", serverStartTime.toLocaleString("ru-RU"))
      .replace("Будет передано сервером", `${Math.floor(uptime / 60)} мин ${uptime % 60} сек`);

    res.send(htmlWithDynamicData);
  });
});

app.listen(4444, (err) => {
  if (err) console.log(err);
  console.log("Server Starting");
  console.log(`http://${enternat2 || enternat4}:4444`);
});
