import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

import { PlatformCredentials } from '../../components/Utils/types';
import processVideosForPlatform from '../../components/Utils/fastpix';

const fetchS3Media = async (sourcePlatform: PlatformCredentials) => {
    const { publicKey, secretKey, additionalMetadata } = sourcePlatform.credentials;
    const { bucket, region } = additionalMetadata;

    const s3 = new S3Client({
        credentials: {
            accessKeyId: publicKey,
            secretAccessKey: secretKey,
        },
        region: region,
    });

    let videos: Array<any> = [];
    let continuationToken: string | undefined = undefined;

    try {
        do {

            // @ts-ignore
            const command  = new ListObjectsV2Command({ 
                Bucket: bucket.trim(),
                ContinuationToken: continuationToken,
            });
            
            // @ts-ignore
            const response = await s3.send(command); 
            const filteredVideos = response.Contents?.filter(file => file.Key?.endsWith('.mp4')) || [];
            videos = [...videos, ...filteredVideos];
            
            // @ts-ignore
            continuationToken = response?.NextContinuationToken ?? ""; 
        } while (continuationToken);

        return {
            success: true,
            videos: videos.map(video => ({
                videoId: video.Key ?? null,
                mp4_url: `https://${bucket}.s3.amazonaws.com/${video.Key}`,
                ETag: video.ETag ?? null
            })),
        };
    } catch (error) {
        
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
     
        const videos = amazonS3Response.videos ?? []; // Vidoes from amazon s3
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
                { message:  errorMsg},
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
