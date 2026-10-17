import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const assetsDir = path.resolve('dist/assets');

if (!fs.existsSync(assetsDir)) {
  console.error(`Erreur : Le dossier ${assetsDir} n'existe pas. Lancez 'npm run build' d'abord.`);
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const jsFiles = files.filter(f => f.endsWith('.js'));

console.log('\n=== SamaAdresse — Rapport des tailles de chunks JS ===\n');
console.log(
  'Fichier'.padEnd(40) +
  'Taille brute'.padStart(15) +
  'Gzip'.padStart(15)
);
console.log('-'.repeat(70));

let entryChunk = null;

for (const file of jsFiles) {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath);
  const rawKb = (content.length / 1024).toFixed(2);
  const gzipKb = (zlib.gzipSync(content).length / 1024).toFixed(2);

  console.log(
    file.padEnd(40) +
    `${rawKb} Ko`.padStart(15) +
    `${gzipKb} Ko`.padStart(15)
  );

  if (file.startsWith('index-') && !entryChunk) {
    entryChunk = { file, rawKb, gzipKb: parseFloat(gzipKb) };
  }
}

console.log('-'.repeat(70));

if (!entryChunk) {
  console.error('Erreur : Aucun chunk d\'entrée index-*.js trouvé !');
  process.exit(1);
}

console.log(`\nChunk d'entrée : ${entryChunk.file}`);
console.log(`Taille gzip : ${entryChunk.gzipKb.toFixed(2)} Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)\n`);

if (entryChunk.gzipKb > 125.0) {
  console.error(`ECHEC : Le chunk d'entrée (${entryChunk.gzipKb.toFixed(2)} Ko gzip) dépasse le seuil maximal strict de 125 Ko !`);
  process.exit(1);
}

if (entryChunk.gzipKb <= 105.0) {
  console.log(`SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (${entryChunk.gzipKb.toFixed(2)} Ko <= 105 Ko) !`);
} else {
  console.log(`CONFORME AU SEUIL MAX : Le chunk d'entrée est inférieur à 125 Ko (${entryChunk.gzipKb.toFixed(2)} Ko <= 125 Ko).`);
}

process.exit(0);
