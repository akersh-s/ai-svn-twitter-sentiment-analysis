import { MachineLearning } from 'aws-sdk';
import { AppS3 } from './app-s3';

const MLModelId = 'ml-HBVg0JKfhwg';
const region = 'us-east-1';

export class AppMachineLearning {
    MLModelId: string = MLModelId;
    ml: MachineLearning = new MachineLearning({ region });
    PredictEndpoint: string;

    createRealtimeEndpoint(): Promise<MachineLearning.CreateRealtimeEndpointOutput> {
        return new Promise<MachineLearning.CreateRealtimeEndpointOutput>((resolve, reject) => {
            this.ml.createRealtimeEndpoint({ MLModelId }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                this.PredictEndpoint = data.RealtimeEndpointInfo.EndpointUrl;
                resolve(data);
            });
        });
    }

    async waitForRealtimeEndpoint(): Promise<MachineLearning.CreateRealtimeEndpointOutput> {
        let realtimeEndpoint: MachineLearning.CreateRealtimeEndpointOutput;
        let attempts = 0;
        while ((!realtimeEndpoint || realtimeEndpoint.RealtimeEndpointInfo.EndpointStatus === 'UPDATING') && attempts < 10) {
            realtimeEndpoint = await this.createRealtimeEndpoint();
            attempts++;
        }
        return realtimeEndpoint;
    }

    deleteRealtimeEndpoint(): Promise<MachineLearning.DeleteRealtimeEndpointOutput> {
        return new Promise<MachineLearning.DeleteRealtimeEndpointOutput>((resolve, reject) => {
            this.ml.deleteRealtimeEndpoint({ MLModelId }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }

    predict(Record: MachineLearning.Record): Promise<MachineLearning.Types.PredictOutput> {
        return new Promise<MachineLearning.Types.PredictOutput>((resolve, reject) => {
            if (!this.PredictEndpoint) {
                reject('Need a predict endpoint');
            }
            const params: MachineLearning.Types.PredictInput = {
                MLModelId,
                Record,
                PredictEndpoint: this.PredictEndpoint
            };
            this.ml.predict(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
}