import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send({ message: "Hello World!" });
});
app.post("/", (req, res) => {
  res.send({ ...req.body });
});

app.listen(9999, () => {
  console.log(`Listen on 9999!`);
});
