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
    type: {
      type: String,
    },
    unit: {
      type: String,
      required: true,
      enum: {
        values: [
          "piece", // штука
          "m", // метр
          "kg", // кг
          "lt", // литр
        ],
        message: `wrong_unit`,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Material", MaterialSchema);
