import { MachineLearning } from 'aws-sdk';
import { AppMachineLearning } from './app-machine-learning';
import { AppS3 } from './app-s3';
async function run() {
    try {
        const ml = new AppMachineLearning();
        const realtimeEndpoint = await ml.waitForRealtimeEndpoint();
        console.log('realtimeEndpoint', realtimeEndpoint);

        const prediction = await ml.predict({
            Var1: '$GOOG',
            Var2: '0',
            Var3: '0',
            Var4: '0',
            Var5: '0'
        });
        console.log('prediction', prediction);
        const deleteRes = await ml.deleteRealtimeEndpoint();
        console.log('deleteRes', deleteRes);
    }
    catch (e) {
        console.error(e);
    }
}
run();
