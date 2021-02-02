import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import database from "./database";
import Subject from "./model/Subject";
import subjectData from "./data/subjectData.json"

dotenv.config();

const app = express();
database.mongoDB(process.env.MONGO_URI);

app.use(cors());
app.use(bodyParser.json());
// app.use(async (req, res, next) => {
//   next();
// });
const validateAuthentication = async (req, res, next) => {
  const json = JSON.stringify(req.body);
  try {
    const response = await axios.post("https://myapi.ku.th/auth/login", json, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
      },
    });
    res.status(200).send({
      "x-access-token": response.data.accesstoken,
    });
    // console.log(response.data);
  } catch (error) {
    res.status(500).send({
      code: "ldap_error",
      message: "Account " + req.body.username + " not found.",
      user: null,
    });
  }
};

const decodeToken = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);
  req.user = decoded;
  next();
};

app.post("/login", validateAuthentication, async (req, res) => {
  res.status(200).send({ message: "ok" });
});

app.post("/detail", decodeToken, async (req, res) => {
  // console.log(req.headers.authorization.split(" ")[1]);
  // const json = JSON.stringify(req.body);
  const startYear = parseInt(req.user.idcode/100000000);
  let studentYear = (startYear >= 60) ? 2559 : 2555
  // console.log(req.user);
  try {
    const detail = await axios.get(
      `https://myapi.ku.th/std-profile/getStdEducation?stdId=`.concat(
        req.user.stdid
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
          "x-access-token": req.headers.authorization.split(" ")[1],
        },
      }
    );
    const path = 'https://myapi.ku.th/std-profile/checkGrades?idcode='.concat(req.user.idcode)
    const studentSubject = await axios.get(path, {
    headers: {
      'Content-Type': 'application/json',
      'app-key' : 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
      'x-access-token' : req.headers.authorization.split(" ")[1],
      },
    })
    // console.log(detail.data.results.education);
    // console.log(studentSubject.data.results[0])
    const subjectId = studentSubject.data.results.map( data => data.grade).map( data => data.map(data => data.subject_code)).flat()
    const subjects = (await Promise.all(subjectId.map(id => Subject.findOne({id, year: studentYear})))).filter(subject => !!subject)
    res.status(200).send({ data: detail.data, baseDetail: req.user, subject: subjects });
  } catch (error) {
    res.status(500).send("error");
  }
  // res.send("hello");
});

app.get("/addallsubject", async (req, res) => {
  subjectData.map(async (x) => {
    const subject = new Subject(x)
    await subject.save()
  })
  // const user = User.()
  // const course = await Course.find()
  res.status(200).send('complete')
});

app.get("/test", async (req, res) => {
  // const subject = Subject.()
  const subject = await Subject.find({year: 2559, id: "01175113"})
  res.status(200).send(subject)
});



const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
