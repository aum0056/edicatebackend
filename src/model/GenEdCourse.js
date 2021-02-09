import mongoose from "mongoose"

const GenEdCourseSchema = new mongoose.Schema({
    year:Number,
    group:Array,
    type:String
});

const GenEdCourse = mongoose.model("GenEdCourse", GenEdCourseSchema);

export default GenEdCourse;