import express from "express";
import bodyParser from "body-parser";
import {randomUUID} from "crypto";
import {readFileSync, writeFile} from "fs";

const app = express();
app.use(bodyParser.json());

const FILENAME = "/data/data.json"
const bestellungenRepository: Bestellung[] = read();

app.post("/bestellungen", (req, res) => {
  const bestellungRequest = req.body as BestellungRequest;
  const bestellungComplete: Bestellung = {
    id: randomUUID(),
    zeitstempel: new Date(),
    ...bestellungRequest
  }
  bestellungenRepository.push(bestellungComplete);
  write(bestellungenRepository);
  console.log(bestellungenRepository);
  res.send(bestellungComplete);
});

app.get("/besteller/:bestellerId", (req, res) => {
  const bestellerId = req.params.bestellerId;
  const bestellungen = bestellungenRepository
      .filter((bestellung) => bestellung.bestellerId === bestellerId);
  const bestellungResult: BestelllisteResult =
      {
        items: bestellungen
      };
  res.send(bestellungResult);
});

function write(bestellungen: Bestellung[]) {
  const data = JSON.stringify(bestellungen);
  writeFile(FILENAME, data,
          err => {if (err) console.error(err)});
}

function read(): Bestellung[] {
  try {
    const data = readFileSync(FILENAME, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

let port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`Listen on ${port}!`);
});

interface BestellungRequest {
  bestellerId: string,
  preis: number,
  produkte: {
    [produktId: string]: number
  }
}

interface Bestellung extends BestellungRequest {
  id: string,
  zeitstempel: Date
}

interface BestelllisteResult {
  items: Bestellung[]
}
