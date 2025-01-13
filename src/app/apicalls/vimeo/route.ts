import { NextResponse } from "next/server";

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

const fetchVimeoMedia = async (sourcePlatform: PlatformCredentials) => {
    const token = sourcePlatform?.credentials?.secretKey;

    try {
        const response = await fetch('https://api.vimeo.com/me/videos', {
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

        return {
            success: true,
            videos: vimeoVideoRes?.data?.map(video => ({
                videoId: video?.link.split("/")?.at(-1) ?? null,
                mp4_url: video?.download?.find((file) => file.quality === 'source')?.link ?? null,
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
