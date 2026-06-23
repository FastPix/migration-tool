import { NextResponse } from "next/server";

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

// Resolve the best downloadable MP4 URL for a Vimeo video.
// Vimeo only populates these arrays when the account plan + token scope allow
// downloads; otherwise everything is empty and we return null.
const resolveVimeoMp4Url = (video: any): string | null => {
    const byHeightDesc = (a: any, b: any) => (b?.height ?? 0) - (a?.height ?? 0);

    const downloads = Array.isArray(video?.download) ? video.download : [];
    // Prefer the original source file, then the highest-resolution download rendition.
    const source = downloads.find((file: any) => file?.quality === 'source');
    if (source?.link) return source.link;
    const bestDownload = [...downloads].sort(byHeightDesc)[0];
    if (bestDownload?.link) return bestDownload.link;

    // Legacy fallback: progressive MP4 files (requires the video_files scope).
    const files = Array.isArray(video?.files) ? video.files : [];
    const bestProgressive = files
        .filter((file: any) => file?.link && (file?.type === 'video/mp4' || file?.quality === 'source'))
        .sort(byHeightDesc)[0];
    if (bestProgressive?.link) return bestProgressive.link;

    return null;
};

const fetchVimeoMedia = async (sourcePlatform: PlatformCredentials) => {
    console.log("[Vimeo] Fetching videos from Vimeo");
    const token = sourcePlatform?.credentials?.secretKey;

    try {
        // Explicitly request the download/files fields so Vimeo returns them when permitted.
        const url = 'https://api.vimeo.com/me/videos?fields=link,download,files,tags,metadata&per_page=100';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const vimeoVideoRes = await response.json();
        if (!response.ok) {

            return { success: false, status: vimeoVideoRes?.status ?? 404, message: vimeoVideoRes?.developer_message };
        }

        console.log(`[Vimeo] Fetched ${vimeoVideoRes?.data?.length ?? 0} video(s) from Vimeo`);
        return {
            success: true,
            videos: vimeoVideoRes?.data?.map(video => ({
                videoId: video?.link.split("/")?.at(-1) ?? null,
                mp4_url: resolveVimeoMp4Url(video),
                tags: video?.tags,
                metadata: video?.metadata
            })),
        };
    } catch (error) {

        return { success: false, message: error?.message}
    }
};

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform;
        const destinationPlatform = data?.destinationPlatform;
        console.log(`[Vimeo POST] Migration started — source=${sourcePlatform?.id}, destination=${destinationPlatform?.id}`);
        const vimeoVideosRes = await fetchVimeoMedia(sourcePlatform);

        if (!vimeoVideosRes.success) {

            return NextResponse.json(
                { message: vimeoVideosRes.message ?? "Something went wrong while fetching videos from Vimeo Video" },
                { status: 404 }
            );
        }

        const result = await processVideosForPlatform(destinationPlatform, vimeoVideosRes?.videos, "vimeo")
        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        console.log(`[Vimeo POST] FastPix processing done — created=${createdMedia.length}, failed=${failedMedia.length}`);
        if (createdMedia.length > 0 || failedMedia.length > 0) {

            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = vimeoVideosRes?.videos?.length === 0 ? "No Vidoes found in Vimeo Video" : "Failed to create Media"
            
            return NextResponse.json(
                { message: errorMsg },
                { status: 400 }
            );
        }

    } catch (error) {

        return NextResponse.json(
            JSON.stringify({ message: error?.message ?? "Something went Wrong" }),
            { status: 500 }
        );
    }
}
