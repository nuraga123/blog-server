import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserModel from "../models/Users.js";
import {
  returnUserData,
  checkUser,
  duplicateUserError,
  errorsMessage,
  generateCode,
} from "../utils/checkAuth.js";
import dotenv from "dotenv";

dotenv.config();

// Генерация токена
export const tokenGenerate = ({ _id }) => {
  return jwt.sign({ _id }, process.env.ADMIN_SECRET, { expiresIn: "30d" });
};

// Регистрация пользователя
export const registerAndCheckAdmin = async (req, res) => {
  try {
    const notFoto =
      "https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1";
    const { username, email, password, password_confirm, userImageUrl } =
      req.body;

    if (!username || !email || !password || !password_confirm) {
      return res.status(400).json({ message: "empty_fields" });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ message: "not_match_password" });
    }

    const duplicate = await duplicateUserError({ username, email });
    if (duplicate) return res.status(403).json({ message: duplicate });

    const hashPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const user = await new UserModel({
      adminCheck: false,
      username,
      email,
      passwordHash: hashPassword,
      userImageUrl: userImageUrl ? userImageUrl : notFoto,
      resetPasswordToken: generateCode(),
    }).save();

    console.log(user);
    return res.status(201).json({ message: "confirm_admin" });
  } catch (error) {
    errorsMessage(error, res, "register", 500);
  }
};

export const confirmAdminUser = async (req, res) => {
  try {
    const { email, resetPasswordToken } = req.body;

    if (!email || !resetPasswordToken) {
      return res.status(400).json({ message: "Email и токен обязательны" });
    }

    const user = await UserModel.findOne({ email, resetPasswordToken });
    if (!user) {
      return res.status(403).json({ message: "Неверный токен или email!" });
    }

    if (user?.resetPasswordToken === resetPasswordToken) {
      await UserModel.updateOne(
        { email, resetPasswordToken },
        { $unset: { resetPasswordToken: "" } }
      );
    }

    user.adminCheck = true;
    delete user.resetPasswordToken;
    await user.save();

    console.log(user);

    return res
      .status(200)
      .json({ message: "учетная запись подтверждена администратором!" });
  } catch (error) {
    errorsMessage(error, res, "confirmToken", 500);
  }
};

// Вход пользователя
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    checkUser(user, res);

    if (!user)
      return res.status(403).json({ message: "Пользователь не найден!" });

    const isValidPass = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPass)
      return res.status(403).json({ message: "invalid_password" });

    const token = tokenGenerate(user._id);
    return res.json({ ...returnUserData(user), token });
  } catch (error) {
    errorsMessage(error, res, "login", 500);
  }
};

// Получение данных текущего пользователя
export const getMe = async (req, res) => {
  try {
    if (req?.userId) return {
      message: "Требуется авторизация",
      status: 401,
    }

    const user = await UserModel.findById(req.userId);

    checkUser(user, res);

    return res.json({ ...returnUserData(user) });
  } catch (error) {
    errorsMessage(error, res, "getMe Ошибка авторизации", 500);
  }
};

// Получение всех пользователей
export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    return res.json(users.map((user) => returnUserData(user)));
  } catch (error) {
    errorsMessage(error, res, "getUsersAllEmail", 500);
  }
};

// Проверка существования email
export const checkUserEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email обязателен" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Пользователь с таким email не найден" });
    }

    return res.status(200).json({
      message:
        "На ваш Email программист отправит сообщение с кодом. Вставьте его в раздел token.",
    });
  } catch (error) {
    console.error("Ошибка при запросе сброса пароля:", error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

// Проверка администратора
export const checkAdmin = async (req, res) => {
  try {
    const { email, secret } = req.body;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret)
      return res
        .status(403)
        .json({ message: "Секрет администратора не указан" });

    if (!email || !secret) {
      return res.status(400).json({ message: "Email и секрет обязательны" });
    }

    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(403)
        .json({ message: "Пользователь с таким email не найден" });

    if (secret !== adminSecret)
      return res.status(403).json({ message: "not_admin" });

    return res.status(200).json({ message: "admin" });
  } catch (error) {
    errorsMessage(error, res, "getUsersAllEmail", 500);
  }
};

// Создание токена для сброса пароля
export const createResetPassword = async (req, res) => {
  try {
    const { email, secret } = req.body;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret)
      return res
        .status(403)
        .json({ message: "Секрет администратора не указан" });
    if (secret !== adminSecret)
      return res.status(403).json({ message: "not_admin" });
    if (!email) return res.status(400).json({ message: "Email обязателен" });

    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(403)
        .json({ message: "Пользователь с таким email не найден" });

    if (user?.resetPasswordToken) {
      return res.status(200).json({
        message: `уже существует токен для сброса пароля ${user?.resetPasswordToken}`,
      });
    } else {
      user.resetPasswordToken = generateCode();
      await user.save();
      return res
        .status(201)
        .json({ message: `Токен: ${user?.resetPasswordToken}` });
    }
  } catch (err) {
    errorsMessage(err, res, "createResetPassword", 500);
  }
};

// Обновление пароля пользователя
export const updatePassword = async (req, res) => {
  try {
    const {
      email,
      username,
      resetPasswordToken,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !email ||
      !username ||
      !resetPasswordToken ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Пароли не совпадают" });
    }

    const user = await UserModel.findOne({
      email,
      username,
      resetPasswordToken,
    });
    if (!user) {
      return res.status(403).json({
        message:
          "Пользователь с указанными данными не найден или неверный токен сброса",
      });
    }

    const hashPassword = await bcrypt.hash(
      newPassword,
      await bcrypt.genSalt(10)
    );

    user.passwordHash = hashPassword;
    user.resetPasswordToken = "";
    await user.save();

    return res.status(200).json({ message: "Пароль успешно обновлен" });
  } catch (err) {
    errorsMessage(err, res, "updatePassword", 500);
  }
};
