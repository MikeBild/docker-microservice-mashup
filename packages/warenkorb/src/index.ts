import express from "express";
import bodyParser from "body-parser";
import {getWarenkorbFile, writeWarenkorbFile} from "./warenkorbService";
import Warenkorb from "./warenkorb";

const app = express();
app.use(bodyParser.json());

app.put("/warenkorb/:id", async (req, res) => {

    const warenkorb: Warenkorb = {
        id: req.params["id"],
        produkte: req.body["produkte"],
        zeitStempel: new Date()
    }
    const result = await writeWarenkorbFile(warenkorb);
    res.send(result);
});

app.get("/warenkorb/:id", async (req, res) => {
    const warenkorb = await getWarenkorbFile(req.params["id"]);
    res.send(warenkorb);
});

app.get("/", (req, res) => {
    res.send("Warenkorb service is ready!");
});

app.listen(process.env.PORT || 4567, () => {
    console.log(`Listen on 4567!`);
});
