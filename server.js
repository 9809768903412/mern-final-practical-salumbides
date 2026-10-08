const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Student = require("./models/Student");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(() => console.error("Unable to connect to MongoDB"));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.get("/students", async (req, res) => {
  const students = await Student.find();

  res.json(students);
});

function studentData(req, res) {
  const { name, course, age } = req.body || {};
  if (typeof name !== "string" || !name.trim() ||
      typeof course !== "string" || !course.trim() ||
      typeof age !== "number" || !Number.isInteger(age) || age < 0) {
    res.status(400).json({ message: "Enter a name, course, and a valid whole-number age." });
    return null;
  }
  return { name: name.trim(), course: course.trim(), age };
}

app.post("/students", async (req, res) => {
  const data = studentData(req, res);
  if (!data) return;
  const student = new Student(data);
  await student.save();
  res.status(201).json(student);
});

app.put("/students/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student ID." });
  }
  const data = studentData(req, res);
  if (!data) return;
  const student = await Student.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true
  });
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json(student);
});

app.delete("/students/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student ID." });
  }
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json({ message: "Student deleted." });
});

app.use((error, req, res, next) => {
  res.status(500).json({ message: "Unable to complete the request. Check the MongoDB connection." });
});

const port = process.env.PORT || 5001;
app.listen(port, "0.0.0.0", () => {
  console.log("Server running on port", port);
});
