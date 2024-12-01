import { validationResult } from "express-validator"

export default (req, res, next) => {
  const errors = validationResult(req);
  if (errors?.array()?.length) console.log(errors);
  if (!errors.isEmpty()) return res.status(400).json({
    message: errors.array()?.map((el) => el.msg).toString()
  });
  next();
}