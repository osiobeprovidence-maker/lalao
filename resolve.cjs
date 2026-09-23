const fs = require('fs');
const { SourceMapConsumer } = require('source-map');
const path = require('path');

async function resolve() {
  const dir = path.join(__dirname, 'dist', 'assets');
  const files = fs.readdirSync(dir);
  const mapFile = files.find(f => f.startsWith('index-') && f.endsWith('.js.map'));
  if (!mapFile) {
    console.error('No source map found');
    return;
  }
  
  const mapPath = path.join(dir, mapFile);
  const mapContent = fs.readFileSync(mapPath, 'utf8');
  
  await SourceMapConsumer.with(mapContent, null, consumer => {
    // We check offsets around 137128. Let's check 137000 to 137200.
    const results = new Set();
    for (let c = 137100; c <= 137150; c++) {
      const pos = consumer.originalPositionFor({
        line: 1,
        column: c
      });
      if (pos.source) {
        results.add(`${pos.source}:${pos.line} (column: ${c}) -> ${pos.name || ''}`);
      }
    }
    
    Array.from(results).forEach(r => console.log(r));
  });
}

resolve().catch(console.error);
