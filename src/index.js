import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
// import database from "./database";
// import User from "./model/User";

dotenv.config();

const app = express();

// database.mongoDB(process.env.MONGO_URI);

app.use(cors());
app.use(bodyParser.json());
app.use(async (req, res, next) => {
  // console.log(`request at ${new Date().toISOString()}`);
  console.log(req.body);
  next();
});
const validateAuthentication = async (req, res, next) => {
  const json = JSON.stringify(req.body);
  console.log(json);
  const response = await axios.post("https://myapi.ku.th/auth/login", json, {
    headers: {
      "Content-Type": "application/json",
      "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  // console.log(response.data);
  // res.status(200).send({ accesstoken: response.data.accesstoken,
  //   idCode:response.data.user.idCode });
  // const path = "https://myapi.ku.th/std-profile/checkGrades?idcode=".concat(
  //   response.data.user.idCode
  // );
  // const userData = await axios.get(path, {
  //   headers: {
  //     "Content-Type": "application/json",
  //     "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
  //     "x-access-token": response.data.accesstoken,
  //   },
  // });
  res.status(200).send({ data: response.data });
  // const user = users.find(user => user.username === username)
  // if(user) {
  //   if(password === user.password) {
  //     next()
  //   } else {
  //     res.status(401).send({message: 'Unauthenticate'})
  //   }
  // }
  // console.log(user)
  next();
};

app.post("/login", validateAuthentication, async (req, res) => {
  res.status(200).send({ message: "ok" });
});

app.get("/", async (req, res) => {
  res.status(200).send({ data: user });
});

// app.get("/users/:id", async (req, res) => {
//   console.log(req.query);
//   console.log(req.params);
//   // console.log(object);
//   const { id } = req.params;
//   // const user = await User.findById(id);
//   const user = await User.findOne({ name: "juis" });
//   // const user = users.find((user) => user.id == id);
//   // console.log(user);
//   res.status(200).send({ user: user });
// });

// const validateBody = async (req, res, next) => {
//   const { name } = req.body;
//   if (name === "jui")
//     return res.status(400).send({ message: `name ${name} is not allowed` });
//   else next();
// };

// app.post("/users", validateBody, async (req, res) => {
//   const { name } = req.body;

//   const user = new User({ name });
//   await user.save();

//   res.status(201).send({ user });
// });

// app.put("/users/:id", async (req, res) => {});

// app.delete("/users/:id", async (req, res) => {});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
