import express from "express";
import bodyParser from "body-parser";
import {getWarenkorbFile, writeWarenkorbFile} from "./warenkorbService";
import Warenkorb from "./warenkorb";

const app = express();
app.use(bodyParser.json());

app.put("/warenkorb/:id", (req, res) => {

    const warenkorb: Warenkorb = {
        id: req.params["id"],
        produkte: req.body["produkte"],
        zeitStempel: new Date()
    }
    writeWarenkorbFile(warenkorb);
    res.send(JSON.stringify(warenkorb));
});

app.get("/warenkorb/:id", (req, res) => {
    try {
        const warenkorb = getWarenkorbFile(req.params["id"]);
        res.send(warenkorb);
    } catch(err) {
        res.status(404).send({"message": "Warenkorb nicht gefunden."});
    }
});

app.get("/", (req, res) => {
    res.send("Warenkorb service is ready!");
});

app.listen(process.env.PORT || 4567, () => {
    console.log(`Listen on 4567!`);
});
