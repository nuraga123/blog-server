import jwt from "jsonwebtoken";
import UserModel from '../models/Users.js'


export default (req, res, next) => {
  console.log('checkAuth middleware');
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: 'Нет токена' });
  } else {
    const result = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    if (result) {
      try {
        const decoded = jwt.verify(result, 'secret123');
        req.userId = decoded._id;
        next();
      } catch (error) {
        console.error('catch verification error:', error);
        return res.status(402).json({ message: `Неправильный токен ! Синтаксическая ошибка: ${(error)?.message}` });
      }
    }
  }
}

export const dateFormat = (date) => new Date(date).toLocaleString().slice(0, -3);

export const returnUserData = (user) => {
  if (user) {
    const date = dateFormat(user.createdAt);
    const {
      passwordHash,
      updatedAt,
      __v,
      createdAt,
      ...usersData
    } = user?._doc;
    return { ...usersData, date };
  } else {
    return { message: 'Нет пользователя !' };
  }
};

export const checkUser = (user, res) => user ? user : res.status(403).json({ message: 'Нет пользователя !' });

export const duplicateUserError = async ({ username, email }) => {
  const userDuplicate = await UserModel.findOne({ username, email })
  if (userDuplicate) return `Уже существует пользователь c таким именем или email`
}

export const errorsMessage = (error, res, resText, statusCode) => {
  console.log(error);
  return res.status(statusCode).json({ message: `${resText} !` });
}