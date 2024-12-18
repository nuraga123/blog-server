import mongoose from "mongoose";

const BarnSchema = new mongoose.Schema(
  {
    barnName: {
      type: String,
      required: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    brokenStock: {
      type: mongoose.Types.Decimal128,
      required: true,
    },
    lostStock: {
      type: mongoose.Types.Decimal128,
      required: true,
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
