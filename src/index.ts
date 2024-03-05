import { Parser } from 'node-expat';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { create } from 'xmlbuilder';
import type { XMLElement } from 'xmlbuilder';

async function XMLConverter(path: string) {
  const root = create('document', { encoding: 'utf-8', headless: true });
  const parser = new Parser('UTF-8');
  const file = await readFile(path, { encoding: 'utf-8' });
  const parseErrors: Error[] = [];
  let paragraphId = 0;
  let currentElement: XMLElement = root;
  let currentPictureCDATA = '';

  parser.on('startElement', function (name, attrs) {
    switch (name) {
      case 'EXTERNAL':
        currentElement = currentElement.ele('a', {
          href: `kodeks://link/d?nd=${attrs.ND}&amp;mark=${attrs.CONTEXT}`,
        });
        break;
      case 'CHAPMARK':
        currentElement = currentElement.ele(
          'p',
          {
            id: attrs.MARKER,
            class: `T${attrs.LEVEL} ${attrs.HIDDEN === 1 ? 'p-hidden' : ''}`,
          },
          attrs.STRING
        );
        break;
      case 'P':
        currentElement = currentElement.ele('p', {
          class: `${attrs.CLASS ? attrs.CLASS : ''} ${
            attrs.ALIGN ? `p-${attrs.ALIGN}` : ''
          }`,
          'data-pid': paragraphId,
        });
        paragraphId += 1;
        break;
      case 'U':
        currentElement = currentElement.ele('span', {
          class: `s-underline`,
        });
        break;
      case 'STRIKE':
        currentElement = currentElement.ele('span', {
          class: `s-strike`,
        });
        break;
      case 'FONT':
        currentElement = currentElement.ele('span', {
          class: `s-color`,
        });
        break;
      case 'I':
        currentElement = currentElement.ele('span', {
          class: `s-italic`,
        });
        break;
      case 'B':
        currentElement = currentElement.ele('span', {
          class: `s-bold`,
        });
        break;
      case 'PICTURE':
        currentElement = currentElement.ele('picture').ele('img');
        break;
      default:
        currentElement = currentElement.ele(name, attrs);
        break;
    }
  });

  parser.on('endElement', function (name) {
    if (currentElement.name === 'img') {
      currentElement.att('src', `data:image/png;base64,${currentPictureCDATA}`);
    }
    currentElement = currentElement.up();
  });

  parser.on('text', function (text) {
    if (currentElement.name === 'img') {
      currentPictureCDATA += text;
    } else {
      currentElement.text(text);
    }
  });

  parser.on('error', function (error) {
    parseErrors.push(error);
  });

  const styles = `
  .headertext{font-weight:bold;font-size:16pt;}
  p{margin-bottom:0pt;margin-left:0pt;margin-right:0pt;margin-top:0pt;min-height:1em;font-family:Arial;font-size:10pt;line-height:1.55em;}
  .s-underline{text-decoration:underline;}
  .s-strike{text-decoration:line-through;}
  .s-color{color:#FF0000;}
  .s-italic{font-style:italic;}
  .s-bold{font-weight:bold;}
  .p-hidden{visibility: hidden}
  .p-left{text-align: left;}
  .p-right{text-align: right;}
  .p-center{text-align: center;}
  .p-justify{text-align: justify;}
  `;

  root.ele('style', { type: 'text/css' }, styles);

  parser.write(file);

  if (parseErrors.length !== 0) {
    throw parseErrors[0];
  }

  return root.end().replace(/<\/?TEXTFIELD>/g, '');
}

async function main(inputPath: string, outputPath: string) {
  try {
    const file = await XMLConverter(inputPath);
    await writeFile(outputPath, file);
  } catch (error) {
    console.error(error);
  }
}

main('data/sourceDoc.xml', 'data/output.html');
