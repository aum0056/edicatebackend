import mongoose from "mongoose";

const RatedSubjectSchema = new mongoose.Schema({
    academicYear:Number,
    semester:Number,
    subjectsGroup: Object
});

const RatedSubject = mongoose.model("RatedSubject", RatedSubjectSchema);

export default RatedSubject;