import express, {Request} from "express";
import bodyParser from "body-parser";
import {randomUUID} from "crypto";

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

const bestellungen: Bestellungen = {};

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

app.post("/bestellungen", (req: Request<BestellungRequest>, res) => {
  const bestellungRequest: BestellungRequest = req.body;
  const bestellung: Bestellung = {...bestellungRequest, bestellnummer: newBestellnummer(), zeitStempel: new Date()};
  if (!(bestellung.bestellerId in bestellungen)) {
    bestellungen[bestellung.bestellerId] = []
  }
  bestellungen[bestellung.bestellerId].push(bestellung);
  res.send(bestellung);
});

app.listen(process.env.PORT || 9998, () => {
  console.log(`Listen on 9998!`);
});
