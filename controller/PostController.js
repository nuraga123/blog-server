import PostModel from '../models/Posts.js';
import UserModel from '../models/Users.js';
import {
  returnUserData,
  checkUser,
  checkUserPost,
  dateFormat,
  errorsMessage,
} from '../utils/checkAuth.js'

export const getLastTags = async (req, res) => {
  try {
    const posts = await PostModel.find().limit(5).exec();

    const tags = posts.map(el => el.tags).flat().slice(0, 5);

    return res.send(tags)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'не смог найти теги'
    })
  }
}

export const createPost = async (req, res) => {
  try {
    const { title, text, imageUrl, tags } = req.body;
    const findUser = await UserModel.findById(req.userId);
    checkUser(findUser, res);

    console.log(returnUserData(findUser))

    const doc = new PostModel({
      title,
      text,
      tags,
      imageUrl,
      viewsCount: 0,
      user: req.userId
    });

    const post = await doc.save();

    const date = dateFormat(post.createdAt);

    const {
      user,
      createdAt,
      updatedAt,
      __v,
      ...datePost
    } = post._doc;

    res.status(201).json({ ...datePost, user: returnUserData(findUser), date });
  } catch (error) {
    errorsMessage(error, res, 'не удалось создать статью', 500)
  }
}

export const getPosts = async (req, res) => {
  try {
    const posts = await PostModel.find().populate('user').exec();
    const dataPosts = posts.map(post => {
      const { notUser, notIdUser } = checkUserPost(post)

      return {
        _id: post._id,
        title: post.title,
        text: post.text,
        tags: post.tags,
        viewsCount: post.viewsCount,
        date: dateFormat(post.createdAt),
        imageUrl: post.imageUrl,
        user: notIdUser ? notUser : {
          _id: post.user._id,
          username: post.user.username,
          email: post.user.email,
          date: dateFormat(post.user.createdAt),
          userImageUrl: post.user.userImageUrl
        },
      }
    });

    return res.send(dataPosts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'не смог найти все статьи'
    })
  }
}

export const getPostByIdAndUpdateViewsCount = async (req, res) => {
  try {
    const postId = req.params.id;

    if (!postId) errorsMessage(postId, res, 'ID не найдена!', 404);

    const updatedPost = await PostModel.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } }, { new: true }).populate("user").exec();

    if (!updatedPost) return errorsMessage(updatedPost, res, "Статья не найдена", 404);

    const { notIdUser, notUser } = checkUserPost(updatedPost)

    const updatedNotUserPost = {
      ...updatedPost._doc,
      user: notUser
    }

    return notIdUser
      ? res.json(updatedNotUserPost)
      : res.json(updatedPost)
  } catch (err) {
    errorsMessage(err, res, 'Ошибка при поиске статьи!', 500);
  }
};

export const removePost = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!postId) errorsMessage(postId, res, 'ID не найдена!', 404);

    const deletePost = await PostModel.findByIdAndDelete(postId);

    if (deletePost == null) errorsMessage(deletePost, res, 'Статья не найдена', 404);
    if (deletePost?._id) return res.json({ message: `Статья удалена id: ${deletePost._id}` })
  }
  catch (error) {
    errorsMessage(error, res, 'Ошибка при удалении статьи!', 500);
  }
}

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!postId) errorsMessage(postId, res, 'ID не найдена!', 404);

    const updatedPost = await PostModel.findByIdAndUpdate(postId, {
      title: req.body.title,
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      tags: req.body.tags,
    }, { new: true });
    if (updatedPost == null) errorsMessage(updatedPost, res, 'Статья не найдена', 404);
    return res.json(updatedPost);
  } catch (error) {
    errorsMessage(error, res, 'Ошибка при изменении статьи!', 500);
  }
};
