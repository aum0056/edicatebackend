import mongoose from "mongoose";

const databases = {
  mongoDB(uri) {
    const db = mongoose.connect(uri, (error) => {
      if (error) console.error("MongoDB error: ", error);
      console.log("MongoDB connected");
    });
    return db;
  },
};

export default databases;