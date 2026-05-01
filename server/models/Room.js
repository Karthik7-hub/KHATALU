import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      length: 6,
      uppercase: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);
export default Room;
