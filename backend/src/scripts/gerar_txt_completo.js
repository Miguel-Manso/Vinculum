const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const outputFile = path.join(rootDir, 'codigo_completo_vinculum.txt');

// Pastas e arquivos a ignorar
const ignoredDirs = new Set(['node_modules', '.git', '.agents', 'dist', '.system_generated', 'scratch']);
const ignoredFiles = new Set([
  'package-lock.json',
  'codigo_completo_vinculum.txt',
  '.DS_Store'
]);

// Extensões de código/texto válidas
const validExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.sql', '.env.example', '.md'
]);

function shouldIncludeFile(filePath) {
  const base = path.basename(filePath);
  if (ignoredFiles.has(base)) return false;
  // Ignora arquivos binários ou de log
  if (base.endsWith('.log') || base.endsWith('.png') || base.endsWith('.ico') || base.endsWith('.webp')) return false;
  const ext = path.extname(filePath);
  if (validExtensions.has(ext)) return true;
  if (base === '.env.example') return true;
  return false;
}

function getDirectoryTree(dir, prefix = '') {
  let lines = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const filtered = sorted.filter(entry => {
    if (entry.isDirectory()) return !ignoredDirs.has(entry.name);
    return shouldIncludeFile(path.join(dir, entry.name));
  });

  filtered.forEach((entry, index) => {
    const isLast = index === filtered.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + entry.name);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(...getDirectoryTree(path.join(dir, entry.name), newPrefix));
    }
  });

  return lines;
}

function getAllCodeFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...getAllCodeFiles(fullPath));
      }
    } else {
      if (shouldIncludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

console.log('Gerando hierarquia e coletando código...');

const tree = getDirectoryTree(rootDir);
const allFiles = getAllCodeFiles(rootDir);

let content = [];
content.push('================================================================================');
content.push('                     VINCULUM — CÓDIGO COMPLETO DO PROJETO');
content.push('================================================================================');
content.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
content.push(`Total de arquivos de código incluídos: ${allFiles.length}`);
content.push('\n');
content.push('--------------------------------------------------------------------------------');
content.push('                       ESTRUTURA HIERÁRQUICA DE PASTAS');
content.push('--------------------------------------------------------------------------------');
content.push('vinculum_junho/');
content.push(tree.join('\n'));
content.push('\n\n');

for (const filePath of allFiles) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  content.push('================================================================================');
  content.push(`ARQUIVO: ${relPath}`);
  content.push('================================================================================\n');

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    content.push(fileContent);
  } catch (err) {
    content.push(`[Erro ao ler arquivo: ${err.message}]`);
  }

  content.push('\n\n');
}

fs.writeFileSync(outputFile, content.join('\n'), 'utf8');
console.log(`✅ Arquivo gerado com sucesso: ${outputFile}`);
console.log(`Tamanho do arquivo: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
