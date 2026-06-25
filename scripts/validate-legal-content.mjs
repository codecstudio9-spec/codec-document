import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stateFile = path.join(root, 'src', 'app', 'data', 'state-variations.ts');
const dataDir = path.join(root, 'src', 'app', 'data');
const pdfGeneratorFile = path.join(root, 'src', 'app', 'services', 'pdf-generator.ts');

function fail(msg) {
  console.error(`\n[validate:legal] ERROR: ${msg}`);
  process.exitCode = 1;
}

function info(msg) {
  console.log(`[validate:legal] ${msg}`);
}

function extractQuotedKeys(block) {
  const keys = new Set();
  const re = /'([^']+)'\s*:/g;
  let m;
  while ((m = re.exec(block))) keys.add(m[1]);
  return keys;
}

function extractBlock(source, startMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) return source.slice(open, i + 1);
  }
  return '';
}

function main() {
  const stateSource = fs.readFileSync(stateFile, 'utf8');

  const usStatesMatch = stateSource.match(/export const US_STATES = \[((?:.|\r|\n)*?)\];/);
  if (!usStatesMatch) {
    fail('Unable to parse US_STATES list.');
    return;
  }

  const usStates = Array.from(usStatesMatch[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
  const uniqueStates = new Set(usStates);
  if (uniqueStates.size !== 50) {
    fail(`US_STATES must contain 50 unique states. Found ${uniqueStates.size}.`);
  } else {
    info('US_STATES contains 50 unique states.');
  }

  const notesBlock = extractBlock(stateSource, "'residential-lease': {");
  if (!notesBlock) {
    fail('Unable to parse residential-lease stateNotes block.');
  } else {
    const notesStates = extractQuotedKeys(notesBlock);
    const missingInNotes = usStates.filter((s) => !notesStates.has(s));
    if (missingInNotes.length > 0) {
      fail(`Missing residential-lease notes for states: ${missingInNotes.join(', ')}`);
    } else {
      info('Residential-lease notes cover all 50 states.');
    }
  }

  const addendumBlock = extractBlock(stateSource, 'const leaseAddendums: Record<string, string> = {');
  if (!addendumBlock) {
    fail('Unable to parse leaseAddendums block.');
  } else {
    const addendumStates = extractQuotedKeys(addendumBlock);
    const missingInAddendums = usStates.filter((s) => !addendumStates.has(s));
    if (missingInAddendums.length > 0) {
      fail(`Missing lease addendums for states: ${missingInAddendums.join(', ')}`);
    } else {
      info('Lease addendums cover all 50 states.');
    }
  }

  const dataFiles = fs.readdirSync(dataDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => path.join(dataDir, f));

  const malformed = [];
  for (const file of dataFiles) {
    const src = fs.readFileSync(file, 'utf8');

    // Heuristic: catches heading collisions like "PROVISIONS{{token}}".
    // Avoid false positives from template logic (e.g. {{else}}) and checkbox markers (e.g. X{{field}}).
    const fused = (src.match(/[A-Z]{4,}\{\{[a-z0-9_]+\}\}/g) || [])
      .filter((token) => !/^X{4,}\{\{/.test(token));
    if (fused.length) {
      malformed.push(`${path.relative(root, file)} -> ${fused[0]}`);
    }
  }

  if (malformed.length > 0) {
    fail(`Potential fused placeholder formatting found:\n- ${malformed.join('\n- ')}`);
  } else {
    info('No fused placeholder formatting issues found.');
  }

  const pdfSource = fs.readFileSync(pdfGeneratorFile, 'utf8');
  if (pdfSource.includes("'es-CR'") || pdfSource.includes('"es-CR"')) {
    fail('Disallowed locale es-CR found in pdf-generator; use en-US/es-ES normalization.');
  } else {
    info('pdf-generator locale normalization check passed.');
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\n[validate:legal] Validation failed.');
    process.exit(process.exitCode);
  }

  console.log('\n[validate:legal] All checks passed.');
}

main();
