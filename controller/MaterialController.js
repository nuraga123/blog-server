import { mongo } from "mongoose";
import MaterialModel from "../models/Material.js";
import { priceFormat } from "../utils/price.js";

const checkBody = ({ name, azencoCode, price, unit }) => {
  const checkCondition = !name || !azencoCode || !price || !unit;

  if (typeof priceFormat(price) === "string") {
    return priceFormat(price);
  }

  return checkCondition
    ? `not${!name ? "_name" : ""}${!azencoCode ? "_azencoCode" : ""}${
        !price ? "_price" : ""
      }${!unit ? "_unit" : ""}`
    : "";
};

// поиск  дублированого товара
export const findDuplicatedMaterial = async ({ name, azencoCode, res }) => {
  try {
    const duplicatedName = await MaterialModel.findOne({ name });
    const duplicatedAzencoCode = await MaterialModel.findOne({ azencoCode });

    if (duplicatedName || duplicatedAzencoCode) {
      return res.send({
        message: `duplicate${duplicatedName ? "_name" : ""}${
          duplicatedAzencoCode ? "_azencoCode" : ""
        }`,
      });
    }

    return false;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error_server" });
  }
};

// создание продукта
export const addMaterial = async (req, res) => {
  try {
    const { name, azencoCode, price, unit } = req.body;

    if (!name || !azencoCode || !price || !unit) {
      return res.status(400).json({
        message: `not${!name ? "_name" : ""}${
          !azencoCode ? "_azencoCode" : ""
        }${!price ? "_price" : ""}${!unit ? "_unit" : ""}`,
      });
    }

    const duplMaterial = await findDuplicatedMaterial({
      name,
      azencoCode,
      res,
    });

    if (duplMaterial) return duplMaterial;

    if (typeof priceFormat(price) === "string") {
      return res.status(400).json({ message: priceFormat(price) });
    } else {
      const material = await MaterialModel.create({
        name,
        azencoCode,
        price: priceFormat(price),
        unit,
      });

      console.log(material);

      return res.status(201).json(material);
    }
  } catch (error) {
    console.log(error);
    const { MongoServerError } = mongo;

    if (error instanceof MongoServerError) {
      const duplicateError = `duplicate_${JSON.stringify(error.keyValue)
        .replaceAll("keyValue", "")
        .replaceAll(":", "_")
        .replaceAll('"', "")
        .replaceAll("{", "")
        .replaceAll("}", "")}`;

      return res.status(400).json({ message: duplicateError });
    }

    if (error?.errors?.unit?.message) {
      return res.status(500).json({
        message: `${error?.errors?.unit?.message}`,
      });
    }

    return res.status(500).json({ message: "error_server" });
  }
};

// Метод для обновления материала
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params; // ID материала
    const { name, azencoCode, price, unit } = req.body;

    const updatedMaterial = await MaterialModel.findByIdAndUpdate(
      id,
      {
        name,
        azencoCode,
        price: priceFormat(price),
        unit,
      },
      { new: true } // Возвращает обновленный документ
    );

    if (!updatedMaterial) {
      return res.status(404).json({ message: "Материал не найден" });
    }

    return res.status(200).json(updatedMaterial);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Ошибка при обновлении материала",
    });
  }
};

// получение всех продуктов
export const getMaterials = async (req, res) => {
  try {
    const material = await MaterialModel.find();

    return res.status(200).json(material);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "не смог найти материалы",
    });
  }
};

// Метод с пагинацией
export const getPaginatedMaterials = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 10;

    const checkPage = !page ? 1 : +page;
    if (isNaN(checkPage)) {
      return res.status(400).json({ message: "not_number" });
    }

    const skip = (checkPage - 1) * limit;
    console.log(skip);

    const totalCount = await MaterialModel.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    if (checkPage > totalPages) {
      return res.status(200).json({ message: "not_page_materials" });
    }

    const materials = await MaterialModel.find().skip(skip).limit(limit);

    return res.status(200).json({
      page: checkPage,
      totalPages,
      totalCount,
      materials,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error_server" });
  }
};

export const searchMaterialStr = async (req, res) => {
  try {
    const { str } = req.body;

    // Проверка на наличие строки для поиска
    if (!str || typeof str !== "string") {
      return res.status(400).json({ message: "invalid_search_string" });
    }

    const findMaterials = await MaterialModel.find({
      name: { $regex: str, $options: "i" },
    });

    return res.status(200).json(findMaterials);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error_server" });
  }
};

export const getMaterialsById = async (req, res) => {
  try {
    const materialId = req.params.id;

    const material = await MaterialModel.findById(materialId);

    if (!material) {
      return res.status(400).json({
        message: "not_material",
      });
    }

    return res.status(200).json(material);
  } catch (error) {}
};
