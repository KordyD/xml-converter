import { Parser } from 'node-expat';
import { readFile, writeFile } from 'node:fs/promises';
import { create } from 'xmlbuilder';
import type { XMLElement } from 'xmlbuilder';

async function XMLConverter(path: string) {
  const root = create('document', { encoding: 'utf-8', headless: true });
  const parser = new Parser('UTF-8');
  const file = await readFile(path, { encoding: 'utf-8' });
  const parseErrors: Error[] = [];
  let currentElement: XMLElement = root;

  parser.on('startElement', function (name, attrs) {
    currentElement = currentElement.ele(name, attrs);
  });

  parser.on('endElement', function (name) {
    currentElement = currentElement.up();
  });

  parser.on('text', function (text) {
    currentElement.text(text);
  });

  parser.on('error', function (error) {
    parseErrors.push(error);
  });

  parser.write(file);

  if (parseErrors.length !== 0) {
    throw parseErrors[0];
  }
  return root.end();
}

async function main() {
  try {
    const file = await XMLConverter('data/sourceDoc.xml');
    await writeFile('data/test.xml', file);
  } catch (error) {
    console.error(error);
  }
}

main();
