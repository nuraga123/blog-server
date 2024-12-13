import mongoose from "mongoose";

const BarnSchema = new mongoose.Schema(
  {
    barnName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    brokenCount: {
      type: mongoose.Types.Decimal128,
      required: true,
    },
    brokenCount: {
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
