import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from '../models/Users.js'
import {
  returnUserData,
  checkUser,
  duplicateUserError,
  errorsMessage,
  generateCode
} from '../utils/checkAuth.js'

import dotenv from "dotenv"

dotenv.config();

export const tokenGenerate = ({ _id }) => {
  const token = jwt.sign({ _id }, 'secret123', { expiresIn: '30d' })
  return token;
}

export const register = async (req, res) => {
  try {
    const notFoto = 'https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1';
    const { username, email, password, userImageUrl } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Все поля должны быть заполнены!' });
    }

    const userDuplicate = await duplicateUserError({ username, email });

    if (userDuplicate) {
      console.log("userDuplicate");
      console.log(userDuplicate);
      return res.status(403).json({ message: userDuplicate });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      username,
      email,
      passwordHash: hashPassword,
      userImageUrl: `${userImageUrl}`.length ? userImageUrl : notFoto,
    });

    const user = await doc.save();
    const token = tokenGenerate(user._id);
    returnUserData(user)
    return res.json({ ...returnUserData(user), token });
  } catch (error) {
    errorsMessage(error, res, "register", 500)
  }
}


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    checkUser(user, res);

    if (user) {
      const isValidPass = await bcrypt.compare(password, user._doc.passwordHash);

      if (!isValidPass) return res.status(403).json({
        message: 'invalid_password'
      });

      const token = tokenGenerate(user._id);
      return res.json({ ...returnUserData(user), token });
    }
  } catch (error) {
    errorsMessage(error, res, "login", 500)
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    checkUser(user, res);
    return res.json({ ...returnUserData(user) });
  } catch (error) {
    errorsMessage(error, res, "getMe", 500)
  }
}

export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    return res.json(users.map(user => returnUserData(user)));
  } catch (error) {
    errorsMessage(error, res, "getUsersAllEmail", 500)
  }
}

// Контроллер для проверки email
export const checkUserEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email обязателен" });
    }

    // Ищем пользователя в базе данных
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Пользователь с таким email не найден" });
    }

    // Успешный ответ
    return res.status(200).json({ message: "На ваш Email программист отправит сообщение с кодом. Вставьте его в раздел token." });
  } catch (error) {
    console.error("Ошибка при запросе сброса пароля:", error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};


export const checkAdmin = async (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    console.log("adminSecret");
    console.log(adminSecret);

    if (!adminSecret) return res.status(403).json({ message: "Секрет администратора не указан" });


    const { email, secret } = req.body
    if (!email || !secret) {
      return res.status(400).json({ message: "Email и секрет обязательны" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(403).json({ message: "Пользователь с таким email не найден" });

    if (secret !== adminSecret) return res.status(403).json({ message: "not_admin" });
    return res.status(200).json({ message: "admin" })
  } catch (error) {
    errorsMessage(error, res, "getUsersAllEmail", 500)
  }
};

// Контроллер для создания create resetPasswordToken
export const createResetPassword = async (req, res) => {
  try {
    const { email, secret } = req.body;
    if (!email || !secret) return res.status(400).json({ message: "Все поля обязательны" });
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) return res.status(403).json({ message: "Секрет администратора не указан" });
    if (secret !== adminSecret) return res.status(403).json({ message: "not_admin" });
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(403).json({ message: "Пользователь с таким email не найден" });

    if (user?.resetPasswordToken) {
      return res.status(200).json({
        message: `уже существует токен для сброса пароля ${user?.resetPasswordToken}`
      })
    } else {
      user.resetPasswordToken = `${generateCode()}`;
      await user.save();
      return res.status(201).json({ message: `Токен: ${user?.resetPasswordToken}` });
    }
  } catch (err) {
    errorsMessage(err, res, "createResetPassword", 500)
  }
}

// Контроллер для сброса пароля
export const updatePassword = async (req, res) => {
  try {
    const { email, username, resetPasswordToken, newPassword, confirmPassword } = req.body;

    // Проверка обязательных полей
    if (!email || !username || !resetPasswordToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    // Проверка совпадения нового пароля и подтверждения
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Пароли не совпадают" });
    }

    // Поиск пользователя по email, username и resetPasswordToken
    const user = await UserModel.findOne({ email, username, resetPasswordToken });
    if (!user) {
      return res.status(403).json({
        message: "Пользователь с указанными данными не найден или неверный токен сброса",
      });
    } else {
      // Хэширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(newPassword, salt);

      // Обновление пароля
      user.passwordHash = hashPassword;
      user.resetPasswordToken = "";
      await user.save();
      return res.status(200).json({ message: "Пароль успешно обновлен" });
    }
  } catch (err) {
    errorsMessage(err, res, "updatePassword", 500);
  }
};

