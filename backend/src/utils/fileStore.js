const fs = require('fs').promises;
const path = require('path');

const dataRoot = path.join(__dirname, '..', 'data');

const getPath = (fileName) => path.join(dataRoot, fileName);

async function readJson(fileName, defaultValue = []) {
  try {
    const raw = await fs.readFile(getPath(fileName), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJson(fileName, defaultValue);
      return defaultValue;
    }
    throw error;
  }
}

async function writeJson(fileName, data) {
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(getPath(fileName), payload, 'utf-8');
  return data;
}

module.exports = {
  readJson,
  writeJson,
};
