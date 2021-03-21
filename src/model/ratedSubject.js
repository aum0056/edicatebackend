import mongoose from "mongoose";

const RatedSubjectSchema = new mongoose.Schema({
    academicYear:Number,
    semester:Number,
    group:String,
    subjects:Array
});

const RatedSubject = mongoose.model("RatedSubject", RatedSubjectSchema);

export default RatedSubject;