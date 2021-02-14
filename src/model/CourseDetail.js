import mongoose from "mongoose"

const CourseDetailSchema = new mongoose.Schema({
    year:Number,
    majorCode: String,
    group: [
        {
            nameGroup: String,
            credit: Number,
            fixedSubject: [
                {
                    name: String,
                    credit: Number,
                    subjectId: Array
                }
            ]
        }
    ],
});

const CourseDetail = mongoose.model("CourseDetail", CourseDetailSchema);

export default CourseDetail;