import fs from 'fs-extra';
import { configPath } from '../../../chains/config';

export async function getChains() {

    if (!fs.existsSync(configPath.configChains)) {
        return [];
    }

    return fs.readJsonSync(configPath.configChains);

}