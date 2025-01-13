import { NextResponse } from "next/server";

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

// fetchCloudflareMedia.js
const fetchCloudflareMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials?.secretKey ? credentials.secretKey : null}`,
                'Content-Type': 'application/json',
            },
        });
         
        const cloudFareRes = await response.json(); // cloudfare stream videos response awaiting

         // handling error when response is not ok
         if (!response.ok) {
            return { success: false, status: 404, message: cloudFareRes?.errors?.[0]?.message};
        }

        return { success: true, videos: cloudFareRes };
      
    } catch (error) {

        // @ts-ignore
        return { success: false, status: 404, message: error?.message };
    }
};

// get download url from Cloudflare
const getDownloadUrl = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream/${videoId}/downloads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials?.secretKey ? credentials.secretKey : null}`,
                'Content-Type': 'application/json',
            },
        });
        
        const getMp4UrlRes = await response.json(); // awaiting response for cloudfare download url
        if (!response.ok) {

            return { success: false, status: 404, message: getMp4UrlRes?.errors?.[0]?.message};
        } 
       
        return { success: true, video: { mp4_url: getMp4UrlRes?.result?.default?.url} };

    } catch (error) {
        
        // @ts-ignore
        return { success: false, message: error?.message ?? "Failed to get .mp4 file from cloudfare" };
    }
}

// Cloudflare migration endpoint
export async function POST(request: Request) {
    
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform ? data.sourcePlatform : null;
        const destinationPlatform = data?.destinationPlatform ? data?.destinationPlatform : null;
        const cloudfareVideosRes = await fetchCloudflareMedia(sourcePlatform);

        if (!cloudfareVideosRes.success) {

            return NextResponse.json(
                { message: cloudfareVideosRes.message ?? "Something went wrong while fetching videos from Cloudfare Video"},
                { status: cloudfareVideosRes.status ?? 404}
            );
        }

        const videos = cloudfareVideosRes?.videos?.result ?? []; // Cloudflare video media
        let allDownloadUrls = 0; // all download urls
        let videoData = []; // all videos
        let failedToGetDownloadUrls = []; // videos failed to generate mp4 file

        // Store video IDs and download URLs
        for (const video of videos) {
            const videoId = video.uid;
            const cloudFareDownloadUrlRes = await getDownloadUrl(sourcePlatform, videoId);
            
            if (!cloudFareDownloadUrlRes.success) {
                failedToGetDownloadUrls.push({videoId, error: cloudFareDownloadUrlRes.message});
                continue;
            }
            const mp4_url = cloudFareDownloadUrlRes?.video?.mp4_url ?? null;
            allDownloadUrls += 1;
            videoData.push({ videoId, mp4_url });
        }

        if (videos.length === allDownloadUrls) {
            
            await new Promise(resolve => setTimeout(resolve, 30000));
            const result = await processVideosForPlatform(destinationPlatform, videoData, "cloudfare")
            const createdMedia = result.createdMedia
            const failedMedia = result.failedMedia

            if (createdMedia.length > 0 || failedMedia.length > 0) {
                
                return NextResponse.json(
                    { success: true, createdMedia, failedMedia, failedToGetDownloadUrls },
                    { status: 200 }
                );
            } else {
                const errorMsg = videos.length === 0 ? "No Vidoes found in Cloudfare Video" : "Failed to create Media"
                
                return NextResponse.json(
                    { message: errorMsg },
                    { status: 400 }
                );
            }
        }

    } catch (error) {

        return NextResponse.json(
            
            // @ts-ignore
            { message: error.message ?? "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
