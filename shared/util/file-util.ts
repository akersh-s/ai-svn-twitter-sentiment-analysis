import * as path from 'path';

let userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']; 

export class FileUtil {
    static resultsFile:string = path.join(userHome, 'results.json');
    static buyFile:string = path.join(userHome, 'buy.json');
    static sellStatsFile:string = path.join(userHome, 'sell-stats.json');
}
