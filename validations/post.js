import { body } from "express-validator";

export const postCreateValidation = [
  body("title", "мин 3 сим заголовок").isLength({ min: 3 }).isString(),
  body("text", "мин текст 3 симв.").isLength({ min: 3 }).isString(),
  body("tags", "укаж массив тегов").optional(),
  body("imageUrl", "не верная картинка").optional().isString(),
]