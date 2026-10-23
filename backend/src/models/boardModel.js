import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  color: { type: String, default: "#6366f1" },
  order: { type: Number, default: 0 },
});

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#6366f1" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    columns: {
      type: [columnSchema],
      default: [
        { id: "todo", title: "To Do", color: "#64748b", order: 0 },
        { id: "in-progress", title: "In Progress", color: "#f59e0b", order: 1 },
        { id: "in-review", title: "In Review", color: "#8b5cf6", order: 2 },
        { id: "done", title: "Done", color: "#10b981", order: 3 },
      ],
    },
  },
  { timestamps: true },
);

const Board = mongoose.model("Board", boardSchema);
export default Board;
