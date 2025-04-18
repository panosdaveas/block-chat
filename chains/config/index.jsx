import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = {
    chainsInfo: path.resolve(__dirname, '../..', 'chains', 'testnet-info.json'),
    configChains: path.resolve(__dirname, '../..', 'chains', 'testnet-config.json'),
    deployedChains: path.resolve(__dirname, '../..', 'chains', 'testnet-deployed.json'),
};

export { configPath };