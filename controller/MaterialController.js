import MaterialModel from "../models/Material.js";
import { priceFormat } from "../utils/price.js";

export const addMaterial = async (req, res) => {
  try {
    const { name, azencoCode, price, unit } = req.body;

    if (typeof priceFormat(price) === "string") {
      return res.status(400).json({ message: priceFormat(price) });
    } else {
      const material = await MaterialModel.create({
        name,
        azencoCode,
        price: priceFormat(price),
        unit,
      });

      return res.status(201).json(material);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "не смог найти материалы",
    });
  }
};

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


