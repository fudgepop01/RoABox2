import { fileSystem } from '../../store/fileSystem';

const extractData = (compiled) => {
  const scripts = compiled.scripts;

  const variables = [];
  for (const script of scripts) {
    script.node
  }
}

export default async () => {
  const gmlive = window['gmlive'];
  const scripts = await fileSystem.getAllScripts();

  let sources = [];
  for (let script of scripts) {
    sources.push(new gmlive.source(script.name, script.data));
  }
  const compiled = gmlive.compile(sources);
  console.log(extractData(compiled));
}