import { S3, config } from 'aws-sdk';

export class AppS3 {
    Bucket: string = 'ml-data1';
    s3: S3 = new S3({
        endpoint: 's3-us-east-2.amazonaws.com',
        signatureVersion: 'v4',
        region: 'us-east-2'
    });

    async insertIntoBucket(Key: string, Body: string): Promise<S3.PutObjectOutput> {
        return new Promise<S3.PutObjectOutput>((resolve, reject) => {
            this.s3.putObject({ Bucket: this.Bucket, Body, Key }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    getS3PathForKey(Key: string): string {
        return `${this.Bucket}/${Key}`;
    }

}

