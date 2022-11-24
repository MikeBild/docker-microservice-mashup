import express, {Request} from "express";
import bodyParser from "body-parser";
import {randomUUID} from "crypto";
import { readFile, writeFile } from "fs/promises";
import { readFileSync } from "fs";

const app = express();
app.use(bodyParser.json());

type BestellerId = string;
type ProduktId = string;
type Price = number;
type Bestellnummer = string;
type ProduktAnzahl = { [produktId: ProduktId]: number };

interface Bestellung {
  bestellerId: BestellerId;
  price: Price;
  produkte: ProduktAnzahl;
  bestellnummer: Bestellnummer;
  zeitStempel: Date;
}

interface Bestellungen {
  [bestellerId: BestellerId]: Bestellung[];
}

const databasePath = './localdb.json';

let bestellungen: Bestellungen = JSON.parse(readFileSync(databasePath, {encoding: 'utf-8', flag: 'r'}));
setInterval(async() => {
  bestellungen = JSON.parse(await readFile(databasePath, {encoding: 'utf-8'}));
}, 10000);

app.get("/besteller/:id", (req, res) => {
  const bestellerId = req.params['id'];
  if (bestellerId in bestellungen) {
    res.send({items: bestellungen[bestellerId]});
  } else {
    res.sendStatus(404);
  }
});

interface BestellungRequest {
  bestellerId: BestellerId;
  price: Price;
  produkte: ProduktAnzahl;
}

const newBestellnummer = () => {
  return randomUUID();
}

app.post("/bestellungen", async (req: Request<BestellungRequest>, res) => {
  const bestellungRequest: BestellungRequest = req.body;
  const bestellung: Bestellung = {...bestellungRequest, bestellnummer: newBestellnummer(), zeitStempel: new Date()};
  const newDBState = {...bestellungen};
  if (!(bestellung.bestellerId in newDBState)) {
    newDBState[bestellung.bestellerId] = []
  }
  newDBState[bestellung.bestellerId].push(bestellung);
  await writeFile(databasePath, JSON.stringify(newDBState), 'utf-8');

  res.send(bestellung);
});

app.listen(process.env.PORT || 9998, () => {
  console.log(`Listen on 9998!`);
});
