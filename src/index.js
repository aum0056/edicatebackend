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
// app.use(async (req, res, next) => {
//   next();
// });
const validateAuthentication = async (req, res, next) => {
  const json = JSON.stringify(req.body);
  try {
    const response = await axios.post('https://myapi.ku.th/auth/login', json, {
      headers: {
        'Content-Type': 'application/json',
        'app-key' : 'txCR5732xYYWDGdd49M3R19o1OVwdRFc'
      },
    })
    res.status(200).send({ data: response.data });
    } catch (error) {
      res.status(500).send({"code":"ldap_error","message":"Account "+req.body.username+" not found.","user":null});
    }
  // const path = 'https://myapi.ku.th/std-profile/checkGrades?idcode='.concat(response.data.user.idCode)
  // const userData = await axios.get(path, {
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'app-key' : 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
  //     'x-access-token' : response.data.accesstoken
  //     },
  //   })
  // res.status(200).send({ data: response.data });
  // next()
}

app.post("/login", validateAuthentication, async (req, res) => {
  res.status(200).send({ message: 'ok' });
});

// app.get("/login", async (req, res) => {
//   res.status(401).send('please');
// });

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
