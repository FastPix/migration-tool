import { NextResponse } from "next/server";

import processVideosForPlatform from '../../components/Utils/fastpix';
import { PlatformCredentials } from '../../components/Utils/types';

const VIMEO_API = 'https://api.vimeo.com';

// Fields we ask Vimeo for. `download` / `files` only come back when the token
// carries the `video_files` scope AND the account plan exposes source files.
const VIDEO_FIELDS = 'uri,link,name,status,transcode,is_playable,privacy,download,files,tags,metadata';

const vimeoGet = async (token: string, path: string) => {
    const response = await fetch(`${VIMEO_API}${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    let body: any = null;
    try { body = await response.json(); } catch { /* non-JSON body */ }

    return { ok: response.ok, status: response.status, body };
};

// Vimeo's own id lives in `uri` (/videos/123456789). Deriving it from `link`
// breaks for unlisted videos, whose link is /<id>/<privacy-hash>.
const resolveVimeoVideoId = (video: any): string | null => {
    const fromUri = typeof video?.uri === 'string' ? video.uri.split('/').filter(Boolean).at(-1) : null;
    if (fromUri) return fromUri;
    const linkParts = typeof video?.link === 'string' ? video.link.split('/').filter(Boolean) : [];

    return linkParts.find((part: string) => /^\d+$/.test(part)) ?? linkParts.at(-1) ?? null;
};

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

// Vimeo plans that never expose source/progressive files over the API, no
// matter what the token scope or the per-video download toggle says.
// Vimeo documents file download links as Standard, Advanced, Pro, Business,
// Premium or Enterprise only — Free/Starter (current tiers) and Plus/Basic
// (legacy tiers) are excluded.
// https://help.vimeo.com/hc/en-us/articles/12427806914577
const PLANS_WITHOUT_FILE_ACCESS = ['free', 'basic', 'starter', 'plus'];
const PLANS_WITH_FILE_ACCESS = 'Standard, Advanced, Pro, Business, Premium or Enterprise';

// When no MP4 comes back, say *why* instead of the generic "MP4 URL is 'none'".
// Order matters: report the condition that actually blocks the user first —
// on a Free plan the per-video download toggle is a symptom, not the cause.
const explainMissingMp4 = (video: any, hasFilesScope: boolean, accountPlan: string | null): string => {
    const transcodeStatus = video?.transcode?.status ?? video?.status;
    if (transcodeStatus && transcodeStatus !== 'complete' && transcodeStatus !== 'available') {
        return `Vimeo is still processing this video (status: ${transcodeStatus}). Retry once it finishes transcoding.`;
    }
    if (accountPlan && PLANS_WITHOUT_FILE_ACCESS.includes(accountPlan)) {
        return `No downloadable MP4: the Vimeo account is on the '${accountPlan}' plan, which does not expose file download links through the API. Vimeo supports these on ${PLANS_WITH_FILE_ACCESS} plans only.`;
    }
    if (!hasFilesScope) {
        return "No downloadable MP4: the Vimeo access token is missing the 'video_files' scope. Regenerate the token with the 'public', 'private' and 'video_files' scopes all enabled.";
    }
    if (video?.privacy?.download === false) {
        return "No downloadable MP4: downloads are disabled for this video in Vimeo (Settings > Privacy > Download).";
    }

    return `No downloadable MP4 returned by Vimeo. File download links require a ${PLANS_WITH_FILE_ACCESS} plan and a token with the 'public', 'private' and 'video_files' scopes.`;
};

const fetchVimeoMedia = async (sourcePlatform: PlatformCredentials) => {
    console.log("[Vimeo] Fetching videos from Vimeo");
    const token = sourcePlatform?.credentials?.secretKey;

    if (!token) {
        return { success: false, status: 401, message: "Missing Vimeo access token" };
    }

    try {
        // Check up front whether this token may see file links at all — otherwise
        // every video silently comes back with empty download/files arrays.
        let hasFilesScope = true;
        const verify = await vimeoGet(token, '/oauth/verify');
        if (verify.ok) {
            const scopes = String(verify.body?.scope ?? '').split(/\s+/).filter(Boolean);
            hasFilesScope = scopes.includes('video_files');
            console.log(`[Vimeo] Token scopes: ${scopes.join(', ') || '(none reported)'} — video_files=${hasFilesScope}`);
        } else {
            console.warn(`[Vimeo] Could not verify token scopes (status ${verify.status}); continuing.`);
        }

        // The plan is the most common reason download/files come back absent,
        // so read it once here rather than guessing per video.
        let accountPlan: string | null = null;
        const me = await vimeoGet(token, '/me?fields=account');
        if (me.ok && typeof me.body?.account === 'string') {
            accountPlan = me.body.account.toLowerCase();
            console.log(`[Vimeo] Account plan: ${accountPlan}`);
        }

        // Walk every page — the old single per_page=100 call silently dropped
        // any video past the first 100.
        const videos: any[] = [];
        let path: string | null = `/me/videos?fields=${VIDEO_FIELDS}&per_page=100`;
        while (path) {
            const page: { ok: boolean; status: number; body: any } = await vimeoGet(token, path);
            if (!page.ok) {

                return {
                    success: false,
                    status: page.body?.error_code ?? page.status,
                    message: page.body?.developer_message ?? page.body?.error ?? `Vimeo API returned ${page.status}`,
                };
            }
            videos.push(...(page.body?.data ?? []));
            path = page.body?.paging?.next ?? null;
        }

        console.log(`[Vimeo] Fetched ${videos.length} video(s) from Vimeo`);
        const mapped = videos.map((video) => {
            const mp4Url = resolveVimeoMp4Url(video);

            return {
                videoId: resolveVimeoVideoId(video),
                mp4_url: mp4Url,
                tags: video?.tags,
                metadata: video?.metadata,
                unavailableReason: mp4Url ? undefined : explainMissingMp4(video, hasFilesScope, accountPlan),
            };
        });

        const withoutMp4 = mapped.filter((video) => !video.mp4_url).length;
        if (withoutMp4 > 0) {
            console.warn(`[Vimeo] ${withoutMp4}/${mapped.length} video(s) have no downloadable MP4 URL. Example reason: ${mapped.find((v) => !v.mp4_url)?.unavailableReason}`);
        }

        return { success: true, videos: mapped };
    } catch (error) {

        return { success: false, message: error?.message }
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
