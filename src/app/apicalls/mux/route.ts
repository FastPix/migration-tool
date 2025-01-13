import { NextRequest, NextResponse } from 'next/server';

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

interface Media {
    passthrough: string;
    video_quality: string;
    tracks: Array<Record<string, unknown>>;
    test: boolean;
    status: string;
    resolution_tier: string;
    progress: Record<string, string>;
    playback_ids: Array<Record<string, unknown>>;
    mp4_support: string;
    max_stored_resolution: string;
    max_stored_frame_rate: number;
    max_resolution_tier: string;
    master_access: string;
    master: Record<string, string>;
    ingest_type: string;
    id: string;
    encoding_tier: string;
    duration: number;
    created_at: string;
    aspect_ratio: string;
}

// Get media by ID from Mux
const getMedia = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.mux.com/video/v1/assets/${videoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
            }
        });

        const muxVideoRes = await response.json();

        if (!response.ok) {
            return { success: false, status: muxVideoRes?.status ?? 404, message: muxVideoRes?.error?.messages?.[0] };
        }

        return { success: true, response: muxVideoRes }

    } catch (error) {

        return { success: false, message: "Failed to get media by ID from Mux" };
    }
}

// Fetch all Mux media for a particular workspace
const fetchMuxMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;
    let allVideos: Media[] = [];
    let url = 'https://api.mux.com/video/v1/assets';
    let isMorePages = true;

    try {
        while (isMorePages) {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
                }
            });

            const muxVideoRes = await response.json(); // awaiting mux video response

            if (!response.ok) { // if any error while fetching mux videos returning error
                return { success: false, status: muxVideoRes?.status ?? 404, message: muxVideoRes?.error?.messages?.[0] };
            }

            const videos = muxVideoRes.data ?? [];
            allVideos = allVideos.concat(videos); // if there are more pages concating page by page vidoes

            const nextPage = muxVideoRes.links?.next; // need to call offset page number based on this parameter
            if (nextPage) {
                url = nextPage;
            } else {
                isMorePages = false;
            }
        }

        return { success: true, videos: allVideos };
    } catch (error) {

        return { success: false, message: "Failed to get media from Mux" };
    }
};

// Get master access for non-mp4 video media
const createMasterAccess = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;
    const requestBody = { "master_access": "temporary" };

    try {
        const response = await fetch(`https://api.mux.com/video/v1/assets/${videoId}/master-access`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
            },
            body: JSON.stringify(requestBody)
        });

        const masterAccessRes = await response.json();

        if (!response.ok) {
            return { success: false, status: masterAccessRes?.error?.status ?? 404, message: masterAccessRes?.error?.messages?.[0] };
        }

        return { success: true, response: masterAccessRes };

    } catch (error) {

        return { success: false, message: "Failed to get Master Access for Media" };
    }
}

// Migration API to handle Mux to Fastpix
export async function POST(request: NextRequest) {

    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform ?? null;
        const destinationPlatform = data?.destinationPlatform ?? null;
        const muxVideosRes = await fetchMuxMedia(sourcePlatform);

        if (!muxVideosRes.success) {

            return new NextResponse(
                JSON.stringify({ success: false, message: muxVideosRes.message ?? 'Failed to fetch media from Mux' }),
                { status: 404 }
            );
        }

        const videos = muxVideosRes?.videos ?? [];
        const videoData: { passthrough?: string; videoId: string, mp4_support: string, playbackId: any }[] = []; // storing all videos which have mp4 support and create master access files
        const masterAccessNeeded: string[] = []; // store media IDs needing master access
        const failedTocreateMasterAccessFile = []; // storing media that failed to create master access from mux
        const failedToGetMediaById = []; // storing media ids that failed to get media by id

        // Process each video
        for (const video of videos) {
            const videoId = video?.id;
            const playbackId = video?.playback_ids?.[0]?.id;
            const mp4_support = video?.mp4_support;
            const master_access = video?.master?.url;
            const passthrough = video?.passthrough;

            if (mp4_support !== "none" || master_access !== undefined) {

                // If mp4_support exists, push video data directly
                const url = mp4_support !== "none" ? mp4_support : master_access;
                videoData.push({ videoId, mp4_support: url, playbackId: playbackId, passthrough });

            } else {
                // If mp4_support does not exist, create master access
                const createdMasterAccess = await createMasterAccess(sourcePlatform, videoId);

                if (!createdMasterAccess.success) { // if any video failed to get master access push video details and skip for next video
                    failedTocreateMasterAccessFile.push({ videoId, error: createdMasterAccess?.message })
                    continue;
                }

                const mediaId = createdMasterAccess?.response?.data?.id;
                masterAccessNeeded.push(mediaId);  // Add to master access list
            }
        }

        // If master access videos are present 
        if (masterAccessNeeded.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 60000));

            for (const mediaId of masterAccessNeeded) {
                const getMediaById = await getMedia(sourcePlatform, mediaId);

                if (!getMediaById.success) {
                    failedToGetMediaById.push({ videoId: mediaId, error: getMediaById?.message });
                    continue;
                }

                const mp4_support = getMediaById?.response?.data?.master?.status === "ready" && videos.find(video => video.id === mediaId)?.mp4_support;
                
                // @ts-ignore
                videoData.push({ videoId: mediaId, mp4_support, playbackId: null });
            }
        }

        // All videos processing for fastpix both master access and direct mp4 files
        if (videoData.length > 0) {

            const videos = videoData?.map((each) => {
                return {
                    videoId: each?.videoId ?? null,
                    mp4_url: each?.mp4_support?.startsWith("https://master") ? each.mp4_support : `https://stream.mux.com/${each?.playbackId}/${each?.mp4_support}.mp4`,
                    playbackId: each?.playbackId ?? null,
                    passthrough: each?.passthrough ?? null
                }
            })

            const result = await processVideosForPlatform(destinationPlatform, videos, "mux");
            const createdMedia = result.createdMedia
            const failedMedia = result.failedMedia

            if (createdMedia.length > 0 || failedMedia.length > 0) {

                return NextResponse.json(
                    { success: true, createdMedia, failedMedia, failedTocreateMasterAccessFile, failedToGetMediaById },
                    { status: 200 }
                );
            } else {
                const errorMsg = videos.length === 0 ? "No Videos found in Mux Video" : "Failed to create Media"

                return NextResponse.json(
                    { error: errorMsg },
                    { status: 400 }
                );
            }

        } else {
            const errorMsg = videos.length === 0 ? "No Videos found in Mux Video" : "Failed to create Media"

            return NextResponse.json(
                { error: errorMsg },
                { status: 400 },
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message ?? "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
