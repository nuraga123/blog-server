import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    azencoCode: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: {
        values: [
          "cm", // сантиметр
          "meter", // метр
          "km", // километр
          "kilogram", // кг
          "piece", // штука
          "liter", // литр
          "gram", // грамм
          "ton", // тонна
        ],
        message: "{VALUE} не является допустимым значением для поля unit.",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Material", MaterialSchema);
