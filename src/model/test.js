import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    years:Number,
    id:String,
    thainame:String,
    engname:String,
    credit:Number,
    group:String,
});

const Course = mongoose.model("Course", courseSchema);

export default Course;