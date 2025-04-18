import fs from 'fs-extra';
import { configPath } from '../../../contracts/config';

export async function getContractArtifacts() {
    if (!fs.existsSync(configPath.contractAbi)) {
        return [];
    }
    return fs.readJsonSync(configPath.contractAbi);

}