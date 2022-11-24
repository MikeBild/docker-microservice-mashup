import express from "express";
import bodyParser from "body-parser";
import * as fs from 'fs'

const app = express();
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.sendStatus(200);
});
app.get('/produkte/:id', (req, res) => {
  const id = req.params.id;
  if (!fs.existsSync(`./resources/${id}.json`)) {
    res.sendStatus(404);
    return;
  }
  const rawdata = fs.readFileSync(`./resources/${id}.json`, 'utf-8');
  const produkt = JSON.parse(rawdata);
  res.send(produkt);
})
app.get('/produkte', (req, res) => {
  const filenames = fs.readdirSync(`./resources`);
  const produkte  = filenames.map(filename => {
    const rawdata = fs.readFileSync(`./resources/${filename}`, 'utf-8');
    return JSON.parse(rawdata);
  })
  res.send({items: produkte});
})

app.listen(process.env.PORT || 7777, () => {
  console.log(`Listen on ${process.env.PORT || 7777}!`);
});
