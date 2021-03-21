import mongoose from "mongoose";

const studentcourseyearSchema = new mongoose.Schema({
    startYear:Number,
    stdCourse:Number,
});

const Studentcourseyear = mongoose.model("Studentcourseyear", studentcourseyearSchema);

export default Studentcourseyear;