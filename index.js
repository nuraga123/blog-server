import express from "express";
import mongoose from "mongoose";
import cors from "cors"

import checkAuth, { dateFormat, errorsMessage } from "./utils/checkAuth.js";
import { registerValidation, loginValidation } from "./validations/auth.js";
import { postCreateValidation } from "./validations/post.js";
import { register, login, getMe } from "./controller/UserController.js"
import {
  createPost,
  getPosts,
  getPostByIdAndUpdateViewsCount,
  removePost,
  updatePost,
  getLastTags
} from './controller/PostController.js'
import multer from "multer";
import handleValidationError from "./utils/handleValidationError.js";

const app = express();

mongoose.connect("mongodb+srv://azencodatabase:uzumymw1998@cluster0.lhqt9.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log('DB OK'))
  .catch((err) => console.log('error db', err))

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cors());

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

app.get('', (req, res) => res.send("hello nuraga"));

/* USER */

// register 
app.post('/auth/register', registerValidation, handleValidationError, register);

// login 
app.post('/auth/login', loginValidation, handleValidationError, login);

// get user me 
app.get('/auth/me', checkAuth, getMe);

/* uploads */

app.post('/uploads', checkAuth, upload.single('image'), (req, res) => {
  try {
    res.json(
      {
        message: "Файл загружен успешно",
        url: `/uploads/${req.file.originalname}`
      })
  } catch (error) {
    errorsMessage(error, res, "ошибка загрузки картинки", 500)
  }

});

/*      POSTS       */

// get all posts method
app.get('/posts', checkAuth, getPosts);

// get post by ID method
app.get('/posts/:id', checkAuth, getPostByIdAndUpdateViewsCount);

// create post method
app.post('/posts', checkAuth, postCreateValidation, createPost);

// delete post method
app.delete('/posts/:id', checkAuth, removePost);

// update post method
app.patch('/posts/:id', checkAuth, updatePost);

/* tags */

app.get('/tags', checkAuth, getLastTags);


app.listen(4444, (err) => {
  if (err) console.log(err);
  console.log('Server Starting');
})