import Warenkorb from "./warenkorb";
import * as fs from "fs";

export function writeWarenkorbFile(warenkorb: Warenkorb) : Promise<Warenkorb> {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${warenkorb.id}.json`, JSON.stringify(warenkorb), (err) => {
            if(err) return reject(err);
            resolve(warenkorb);
        });
    })

}

export function getWarenkorbFile(id: string) : Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(`${id}.json`,  (err, data) => {
            if(err) return reject(err);
            resolve(data.toString('utf-8'));
        });
    })
}

