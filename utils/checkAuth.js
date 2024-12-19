import jwt from "jsonwebtoken";
import UserModel from "../models/Users.js";

export default (req, res, next) => {
  console.log("checkAuth middleware");
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: "Нет токена" });
  } else {
    const result = (req.headers.authorization || "").replace(/Bearer\s?/, "");
    if (result) {
      try {
        const decoded = jwt.verify(result, process.env.ADMIN_SECRET);
        req.userId = decoded._id;
        next();
      } catch (error) {
        console.error("catch verification error:", error);
        return res.status(402).json({
          message: `Неправильный токен ! Синтаксическая ошибка: ${error?.message}`,
        });
      }
    }
  }
};

export const dateFormat = (date) =>
  new Date(date).toLocaleString().slice(0, -3);

export const returnUserData = (user) => {
  if (user) {
    const date = dateFormat(user.createdAt);
    const { passwordHash, createdAt, updatedAt, __v, ...usersData } =
      user?._doc;
    return { ...usersData, date };
  } else {
    return { message: "Нет пользователя !" };
  }
};

export const checkUser = (user, res) =>
  user ? user : res.status(403).json({ message: "Нет пользователя !" });

export const duplicateUserError = async ({ username, email }) => {
  const duplicateName = await UserModel.findOne({ username });
  if (duplicateName) return "name_exists";

  const userDuplicateEmail = await UserModel.findOne({ email });
  if (userDuplicateEmail) return "email_exists";

  return 0;
};

export const errorsMessage = (error, res, resText, statusCode) => {
  console.log(error);
  return res.status(statusCode).json({ message: `${resText} !` });
};

// Генерация 4-значного кода
export const generateCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

export const checkUserPost = (post) => {
  console.log("check-user-post");
  console.log(post);
  const notIdUser = !post?.user?._id;
  console.log("notIdUser:", notIdUser);
  if (notIdUser) {
    const notUser = {
      _id: `${post?._id}__${new Date().toISOString()}__${generateCode()}`,
      username: "not_name",
      email: "not_email",
      date: "not_date",
      userImageUrl: "",
    };

    return { notUser, notIdUser };
  }

  return post;
};
