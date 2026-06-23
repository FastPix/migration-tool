import https from 'node:https';

export async function getBucketRegion(bucketUrl: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const req = https.request(bucketUrl, { method: 'HEAD' }, (res) => {
            const raw = res.headers['x-amz-bucket-region'];
            const region = Array.isArray(raw) ? raw[0] : raw;
            if (region) {
                resolve(region);
            } else {
                reject(new Error('Bucket region not found in headers'));
            }
        });

        req.on('error', reject);
        req.end();
    });
}
