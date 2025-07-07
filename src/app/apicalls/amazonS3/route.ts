import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

import { PlatformCredentials } from '../../components/Utils/types';
import processVideosForPlatform from '../../components/Utils/fastpix';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import https from 'https';

export async function getBucketRegion(bucketUrl: string) {
    return new Promise((resolve, reject) => {
        const req = https.request(bucketUrl, { method: 'HEAD' }, (res) => {
            const region = res.headers['x-amz-bucket-region'];
            if (region) {
                resolve(region);
            } else {
                reject('Bucket region not found in headers');
            }
        });

        req.on('error', reject);
        req.end();
    });
}

const isPublicObject = (bucket: string, key: string): Promise<boolean> => {
    const url = `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;

    return new Promise((resolve) => {
        https.request(url, { method: 'HEAD' }, (res) => {
            const status = res.statusCode || 0;
            if (status === 200) {
                resolve(true); // public
            } else if (status === 403 || status === 401) {
                resolve(false); // private
            } else {
                resolve(false); // treat unknown as private
            }
        }).on('error', (err) => {
            console.log("HEAD error:", err.message);
            resolve(false);
        }).end();
    });
};

const fetchS3Media = async (sourcePlatform: PlatformCredentials) => {
    const { publicKey, secretKey, additionalMetadata } = sourcePlatform.credentials;
    const { bucket, region } = additionalMetadata;
    const bucketUrl = `https://${bucket}.s3.amazonaws.com`
    const s3Region = await getBucketRegion(bucketUrl);

    const s3 = new S3Client({
        credentials: {
            accessKeyId: publicKey,
            secretAccessKey: secretKey,
        },
        region: s3Region,
    });

    let videos: Array<any> = [];
    let continuationToken: string | undefined = undefined;

    try {
        do {
            const command = new ListObjectsV2Command({
                Bucket: bucket.trim(),
                ContinuationToken: continuationToken,
            });

            const response = await s3.send(command);
            const filteredVideos = response.Contents?.filter(file => file.Key?.endsWith('.mp4')) || [];
            videos = [...videos, ...filteredVideos];
            continuationToken = response.NextContinuationToken ?? "";
        } while (continuationToken);

        const signedUrls = await Promise.all(videos.map(async (video) => {
            const key = video.Key!;
            const isPublic = await isPublicObject(bucket, key);

            let url: string;
            if (isPublic) {
                url = `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
            } else {
                const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
                url = await getSignedUrl(s3, getCommand, { expiresIn: 86400 });
            }

            return {
                videoId: key,
                mp4_url: url,
                ETag: video.ETag ?? null
            };
        }));

        return {
            success: true,
            videos: signedUrls
        };

    } catch (error: any) {

        // @ts-ignore
        return { success: false, status: 404, message: error?.message };
    }
};

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform as PlatformCredentials;
        const destinationPlatform = data?.destinationPlatform as PlatformCredentials;
        const amazonS3Response = await fetchS3Media(sourcePlatform); // amazonS3 Response

        if (!amazonS3Response.success) {
            return NextResponse.json(
                { message: amazonS3Response.message ?? "Something went wrong while fetching videos from Amazon S3" },
                { status: 404 }
            );
        }

        const videos = amazonS3Response.videos ?? []; // Videos from Amazon S3

        const result = await processVideosForPlatform(destinationPlatform, videos, "amazon-s3"); // process videos in fastpix

        const createdMedia = result.createdMedia; // created vidoes in fastpix
        const failedMedia = result.failedMedia; // failed vidoes in fastpix

        if (createdMedia.length > 0 || failedMedia.length > 0) { // Either video is created or failed to create we send the response

            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else { // If there are no vidoes in amazon s3 then we send 404
            const errorMsg = videos.length === 0 ? "No Vidoes found in AmazonS3 Video" : "Something went wrong";

            return NextResponse.json(
                { message: errorMsg },
                { status: videos.length === 0 ? 404 : 400 }
            );
        }

    } catch (error: any) {

        return NextResponse.json(
            { message: error.message ?? "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
