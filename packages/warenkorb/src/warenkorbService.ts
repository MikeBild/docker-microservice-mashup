import Warenkorb from "./warenkorb";
import * as fs from "fs";

export function writeWarenkorbFile(warenkorb: Warenkorb) {
    fs.writeFile(`${warenkorb.id}.json`, JSON.stringify(warenkorb), (err) => {
        console.log(err);
    });
}

export function getWarenkorbFile(id: string) {
    return fs.readFileSync(`${id}.json`, 'utf8');
}

