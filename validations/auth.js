import { body } from "express-validator";

export const registerValidation = [
  body("username", "укажите имя мин 4 символа").isLength({ min: 4 }),
  body("email", "правильно напишите почту").isEmail(),
  body("password", "пароль мин 8 символов").isLength({ min: 8 }),
]

export const loginValidation = [
  body("email", "правильно напишите почту").isEmail(),
  body("password", "пароль мин 8 символов").isLength({ min: 8 }),
]