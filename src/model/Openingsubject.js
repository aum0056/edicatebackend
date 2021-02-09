import mongoose from "mongoose";

const openingsubjectSchema = new mongoose.Schema({
    year:Number,
    id:String,
    thainame:String,
    engname:String,
    credit:Number,
    group:String,
});

openingsubjectSchema.index({id: 'text', thainame: 'text', engname: 'text', group: 'text'})
const Openingsubject = mongoose.model("Openingsubject", openingsubjectSchema);

export default Openingsubject;