import path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = {
    contractAbi: path.resolve(__dirname, '../..', 'artifacts', 'contracts',  'CrossChain.sol', 'CrossChain.json'),
};

export { configPath };