import mongoose from "mongoose";

const BarnSchema = new mongoose.Schema(
  {
    barnName: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materialName: {
      type: String,
      required: true,
    },
    stock: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0,
      min: 0,
    },
    brokenStock: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0,
      min: 0,
    },
    lostStock: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Barn", BarnSchema);
