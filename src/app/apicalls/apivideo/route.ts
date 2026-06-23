import { NextRequest, NextResponse } from "next/server";

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

// Fetch media from API Video
const fetchApiVideoMedia = async (sourcePlatform: PlatformCredentials) => {
    console.log("[ApiVideo] Fetching videos from API Video");
    const credentials = sourcePlatform?.credentials;
    const endpoint = sourcePlatform?.credentials?.additionalMetadata?.environment === 'sandbox' ? "https://sandbox.api.video/videos" : "https://ws.api.video/videos"
    const videos: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        do {
            const response = await fetch(`${endpoint}?currentPage=${currentPage}&pageSize=25`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${credentials?.secretKey ?? ""}`,
                    "Content-Type": "application/json",
                },
            });
            
            const apiVideoRes = await response.json(); // api video response awaiting

            // handling error when response is not ok
            if (!response.ok) {
                return { success: false, status:  apiVideoRes?.status ?? 404, message:  apiVideoRes?.title};
            }

            videos.push(... apiVideoRes.data);
            totalPages =  apiVideoRes.pagination.pagesTotal;
            currentPage++;
        } while (currentPage <= totalPages);

        console.log(`[ApiVideo] Fetched ${videos.length} video(s) from API Video`);
        return {

            success: true,
            videos: videos.map(video => ({
                videoId: video.videoId ?? null,
                mp4_url: video.assets.mp4 ?? null,
                tags: video.tags,
                metadata: video.metadata
            })),
        };
    } catch (error) {
        
        // @ts-ignore
        return { success: false, status: 404, message: error?.message };
    }
};

// API Video Migration Endpoint
export async function POST(request: NextRequest) {
    try {
        const { sourcePlatform, destinationPlatform } = await request.json();
        console.log(`[ApiVideo POST] Migration started — source=${sourcePlatform?.id}, destination=${destinationPlatform?.id}`);

        const apivideoResponse = await fetchApiVideoMedia(sourcePlatform);
        if (!apivideoResponse.success) {

            return NextResponse.json(
                { message: apivideoResponse.message ?? "Something went wrong while fetching videos from API Video" },
                { status: 404 }
            );
        }

        const videos = apivideoResponse?.videos ?? [];
  
        const result = await processVideosForPlatform(destinationPlatform, videos, "apivideo");
        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        console.log(`[ApiVideo POST] FastPix processing done — created=${createdMedia.length}, failed=${failedMedia.length}`);
        if (createdMedia.length > 0 || failedMedia.length > 0) {

            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in API Video" : "Something went wrong"
           
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
