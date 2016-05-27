import * as path from 'path';
import * as yargs from 'yargs';
let argv = yargs.argv;
let username = argv.username;
let userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']; 

export class FileUtil {
    static resultsFile:string = path.join(userHome, 'results.json');
    static buyFile:string = path.join(userHome, 'buy.json');
    static sellStatsFile:string = path.join(userHome, `sell-stats-${hashCode(username)}.json`);
    static svmFile:string = path.join(userHome, 'svm.json');
}

function hashCode(s) {
    var hash = 0, i, chr, len;
    if (s.length === 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash);
}
