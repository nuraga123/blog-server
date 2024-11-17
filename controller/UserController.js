import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'
import UserModel from '../models/Users.js'
import { returnUserData, checkUser, duplicateUserError, errorsMessage } from '../utils/checkAuth.js'

export const tokenGenerate = ({ _id }) => {
  const token = jwt.sign({ _id }, 'secret123', { expiresIn: '30d' })
  return token;
}

export const register = async (req, res) => {
  try {
    const notFoto = 'https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1';
    const { username, email, password, userImageUrl } = req.body;
    console.log(req.body);
    const userDuplicate = await duplicateUserError({ username, email });
    console.log("userDuplicate");
    console.log(userDuplicate);
    if (userDuplicate) return res.status(403).json({ message: userDuplicate });
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
      if (!isValidPass) return res.status(403).json({ message: 'Invalid Password' });
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