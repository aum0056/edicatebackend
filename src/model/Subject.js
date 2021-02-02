import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    year:Number,
    id:String,
    thainame:String,
    engname:String,
    credit:Number,
    group:String,
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;