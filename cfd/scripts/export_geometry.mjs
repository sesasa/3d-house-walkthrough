import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cfd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=path.resolve(cfd,'../app/src');
const calibration=fs.readFileSync(path.join(app,'calibration.json'),'utf8');
let source=fs.readFileSync(path.join(app,'property.js'),'utf8')
  .replace("import calibration from './calibration.json';",'const calibration='+calibration+';')
  .replaceAll('export const','const');
source='const location={search:""};\n'+source+'\nreturn {property,rooms,walls,accuracyNotes};';
// Evaluate only the existing trusted local property module, with browser state stubbed.
fs.writeFileSync(path.join(cfd,'geometry.json'),JSON.stringify(new Function(source)(),null,2));
