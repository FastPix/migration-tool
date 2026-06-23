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
    console.log(`[Mux] Fetching media by ID: ${videoId}`);
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
        console.error("[Mux] Error fetching media by ID from Mux:", error);
        return { success: false, message: "Failed to get media by ID from Mux" };
    }
}

// Fetch all Mux media for a particular workspace
const fetchMuxMedia = async (sourcePlatform: PlatformCredentials) => {
    console.log("[Mux] Fetching all media from Mux workspace");
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

        console.log(`[Mux] Fetched ${allVideos.length} video(s) from Mux`);
        return { success: true, videos: allVideos };
    } catch (error) {
        console.error("[Mux] Error fetching media from Mux:", error);
        return { success: false, message: "Failed to get media from Mux" };
    }
};

// Get master access for non-mp4 video media
const createMasterAccess = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    console.log(`[Mux] Requesting master access for videoId=${videoId}`);
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
        console.error("[Mux] Error requesting master access for Media:", error);
        return { success: false, message: "Failed to get Master Access for Media" };
    }
}

type VideoDataItem = { passthrough?: string; videoId: string, mp4_support: string, playbackId: any };

// Process a single Mux video: either push it directly (mp4/master url present)
// or request master access and queue its media ID for later polling.
const processVideo = async (
    sourcePlatform: PlatformCredentials,
    video: any,
    videoData: VideoDataItem[],
    masterAccessNeeded: string[],
    failedTocreateMasterAccessFile: { videoId: string; error: any }[]
) => {
    const videoId = video?.id;
    const playbackId = video?.playback_ids?.[0]?.id;
    const mp4_support = video?.mp4_support;
    const master_access = video?.master?.url;
    const passthrough = video?.passthrough;

    if (mp4_support !== "none" || master_access !== undefined) {

        // If mp4_support exists, push video data directly
        const url = mp4_support === "none" ? master_access : mp4_support;
        videoData.push({ videoId, mp4_support: url, playbackId: playbackId, passthrough });

    } else {
        // If mp4_support does not exist, create master access
        const createdMasterAccess = await createMasterAccess(sourcePlatform, videoId);

        if (!createdMasterAccess.success) { // if any video failed to get master access push video details and skip for next video
            failedTocreateMasterAccessFile.push({ videoId, error: createdMasterAccess?.message })
            return;
        }

        const mediaId = createdMasterAccess?.response?.data?.id;
        masterAccessNeeded.push(mediaId);  // Add to master access list
    }
};

// Poll a single Mux asset until its temporary master is ready (or timeout).
const MASTER_ACCESS_POLL_INTERVAL = 10000; // 10s between polls
const MASTER_ACCESS_MAX_ATTEMPTS = 18;     // ~3 minutes total

const waitForMasterReady = async (sourcePlatform: PlatformCredentials, mediaId: string) => {
    for (let attempt = 0; attempt < MASTER_ACCESS_MAX_ATTEMPTS; attempt++) {
        const getMediaById = await getMedia(sourcePlatform, mediaId);

        if (!getMediaById.success) {
            return { success: false, message: getMediaById?.message };
        }

        const mediaData = getMediaById?.response?.data;
        const masterStatus = mediaData?.master?.status;

        if (masterStatus === "ready" && mediaData?.master?.url) {
            return { success: true, data: mediaData };
        }

        if (masterStatus === "errored") {
            return { success: false, message: "Mux failed to prepare master access" };
        }

        // still "preparing" — wait and poll again
        await new Promise(resolve => setTimeout(resolve, MASTER_ACCESS_POLL_INTERVAL));
    }

    return { success: false, message: "Master access not ready (timed out)" };
};

// Poll Mux for the media that needed master access, after waiting for it to be ready.
const resolveMasterAccessVideos = async (
    sourcePlatform: PlatformCredentials,
    masterAccessNeeded: string[],
    videoData: VideoDataItem[],
    failedToGetMediaById: { videoId: string; error: any }[]
) => {
    for (const mediaId of masterAccessNeeded) {
        const ready = await waitForMasterReady(sourcePlatform, mediaId);

        if (!ready.success) {
            failedToGetMediaById.push({ videoId: mediaId, error: ready?.message });
            continue;
        }

        const mediaData = ready.data;
        const masterUrl = mediaData?.master?.url;
        const playbackId = mediaData?.playback_ids?.[0]?.id ?? null;

        videoData.push({ videoId: mediaId, mp4_support: masterUrl, playbackId, passthrough: mediaData?.passthrough });
    }
};

// Build the FastPix video payload from the collected video data.
const buildFastpixVideos = (videoData: VideoDataItem[]) => {
    return videoData?.map((each) => {
        return {
            videoId: each?.videoId ?? null,
            mp4_url: each?.mp4_support?.startsWith("https://") ? each.mp4_support : `https://stream.mux.com/${each?.playbackId}/${each?.mp4_support}.mp4`,
            playbackId: each?.playbackId ?? null,
            passthrough: each?.passthrough ?? null
        }
    });
};

// Migration API to handle Mux to Fastpix
export async function POST(request: NextRequest) {

    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform ?? null;
        const destinationPlatform = data?.destinationPlatform ?? null;
        console.log(`[Mux POST] Migration started — source=${sourcePlatform?.id}, destination=${destinationPlatform?.id}`);
        const muxVideosRes = await fetchMuxMedia(sourcePlatform);

        if (!muxVideosRes.success) {

            return new NextResponse(
                JSON.stringify({ success: false, message: muxVideosRes.message ?? 'Failed to fetch media from Mux' }),
                { status: 404 }
            );
        }

        const videos = muxVideosRes?.videos ?? [];
        const videoData: VideoDataItem[] = []; // storing all videos which have mp4 support and create master access files
        const masterAccessNeeded: string[] = []; // store media IDs needing master access
        const failedTocreateMasterAccessFile = []; // storing media that failed to create master access from mux
        const failedToGetMediaById = []; // storing media ids that failed to get media by id

        // Process each video
        for (const video of videos) {
            await processVideo(sourcePlatform, video, videoData, masterAccessNeeded, failedTocreateMasterAccessFile);
        }

        // If master access videos are present
        if (masterAccessNeeded.length > 0) {
            await resolveMasterAccessVideos(sourcePlatform, masterAccessNeeded, videoData, failedToGetMediaById);
        }

        console.log(`[Mux POST] Videos ready for processing — total=${videoData.length}, masterAccessNeeded=${masterAccessNeeded.length}, failedMasterAccess=${failedTocreateMasterAccessFile.length}`);
        // All videos processing for fastpix both master access and direct mp4 files
        if (videoData.length > 0) {

            const videos = buildFastpixVideos(videoData);

            const result = await processVideosForPlatform(destinationPlatform, videos, "mux");
            const createdMedia = result.createdMedia
            const failedMedia = result.failedMedia

            console.log(`[Mux POST] FastPix processing done — created=${createdMedia.length}, failed=${failedMedia.length}`);
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
