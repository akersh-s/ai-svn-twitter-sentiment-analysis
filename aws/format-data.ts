import { FileUtil } from '../shared/util/file-util';
import { getSvmData } from '../svm/svm-data-formatter';
import { Variables } from '../shared/variables';
import { EOL } from 'os';
import * as fs from 'fs';

(async function formatAwsData() {
    FileUtil.lastResultsFiles = FileUtil.collectLastResultFiles(140);
    console.log(FileUtil.lastResultsFiles);
    const data = await getSvmData();
    const lines = data.xy.map(xy => xy.join(',')).join(EOL) + EOL;
    fs.writeFileSync('./mldata.csv', lines, 'utf-8');
})()
