const fs = require('fs');


const json = JSON.parse(fs.readFileSync('./temp2.json', 'utf8'));

let out = "";
for (const pattern of json.patterns) {
  if (pattern.match) {
    if (pattern.match.startsWith("(?i)\\b(") && pattern.match.endsWith(")\\b")) {
      let chunk = pattern.match.substring(7, pattern.match.length - 3).split('|');
      try {
        let strung = JSON.stringify(chunk);
        out += `${pattern.name}: ${strung};\n`
      } catch {
        out += `${pattern.name}: /${chunk.replace(/\//g, '\\/')}/;`
      }
    }
    else {
      out += `${pattern.name}: /${pattern.match.replace('(?i)', '').replace(/\//g, '\\/')}/;\n`
    }
  }
  else out += `${pattern.name}: NOPE.jpg\n`;
  out += '\n';
}

fs.writeFileSync('./out.txt', out, 'utf8')