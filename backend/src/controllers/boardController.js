import Board from "../models/boardModel.js";
import Task from "../models/taskModel.js";

export const createBoard = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Board title is required" });
    }
    const board = await Board.create({
      title: title.trim(),
      description: description || "",
      color: color || "#6366f1",
      createdBy: req.user._id,
    });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    const boardIds = boards.map((b) => b._id);
    const taskCounts = await Task.aggregate([
      { $match: { board: { $in: boardIds } } },
      { $group: { _id: "$board", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    taskCounts.forEach((t) => {
      countMap[t._id.toString()] = t.count;
    });
    const result = boards.map((b) => ({
      ...b.toObject(),
      taskCount: countMap[b._id.toString()] || 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const tasks = await Task.find({ board: board._id })
      .populate("assignedTo", "name email avatar")
      .sort({ order: 1 });
    res.json({ board, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const { title, description, color, columns } = req.body;
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { title, description, color, columns },
      { new: true, runValidators: true },
    );
    if (!board) return res.status(404).json({ message: "Board not found" });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });
    await Task.deleteMany({ board: req.params.id });
    res.json({ message: "Board deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const { title, description, priority, labels, dueDate, column, assignedTo } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const colId = column || (board.columns[0]?.id ?? "todo");
    const taskCount = await Task.countDocuments({
      board: board._id,
      column: colId,
    });

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      labels: labels || [],
      dueDate: dueDate || null,
      column: colId,
      board: board._id,
      createdBy: req.user._id,
      order: taskCount,
      assignedTo: assignedTo || null,
    });
    await task.populate("assignedTo", "name email avatar");
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const { title, description, priority, labels, dueDate, column, assignedTo } = req.body;
    const updateData = { title, description, priority, labels, dueDate };

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null;
    }

    if (column) {
      const existingTask = await Task.findOne({
        _id: req.params.taskId,
        board: board._id,
      });
      if (existingTask && existingTask.column !== column) {
        const taskCount = await Task.countDocuments({
          board: board._id,
          column: column,
        });
        updateData.column = column;
        updateData.order = taskCount;
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, board: board._id },
      updateData,
      { new: true, runValidators: true },
    ).populate("assignedTo", "name email avatar");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const moveTask = async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const { column, order } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, board: board._id },
      { column, order: order ?? 0 },
      { new: true },
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      board: board._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
