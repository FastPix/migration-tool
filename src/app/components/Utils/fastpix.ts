import Client from "@fastpix/fastpix-node"; 
import { PlatformCredentials } from './types';

interface Videos {
    passthrough?: string,
    videoId: string,
    mp4_url: string,
    tags?: Array<string>,
    metadata?: Array<string>,
    ETag?: string
}

const createMediaInFastPix = async (destinationPlatform: PlatformCredentials, mp4_support: string, videoId: string, metaData: Object, productType: string) => {
    const credentials = destinationPlatform?.credentials ? destinationPlatform.credentials : null;
    const url = 'https://v1.fastpix.io/on-demand';
    const config = destinationPlatform?.config ? destinationPlatform.config : null;
    const maxResolutionTier = config?.maxResolutionTier ? config.maxResolutionTier : "1080p";
    const playbackPolicy = config?.playbackPolicy?.[0];

    const cleanedUrl = mp4_support.trim();
    const finalUrl = cleanedUrl.replace(/\s+/g, ''); // Removes all whitespace

    const requestBody = {
        "metadata": {
            "originPlaformVideoId": videoId,
            
            // @ts-ignore
            ...(productType === 'amazon-s3' && { "ETag": metaData?.[0].ETag }),
            ...(productType === 'apivideo' && {
                
                // @ts-ignore
                "tags": JSON.stringify(metaData?.[0]?.tags),
                
                // @ts-ignore
                "metaData": JSON.stringify(metaData?.[0]?.metaData),
            }),
            ...(productType === "mux" && {
                
                // @ts-ignore
                "passthrough": JSON.stringify(metaData?.[0]?.passthrough)
            }),
        },
        "accessPolicy": playbackPolicy,
        // "subtitles":{
        //     "languageName":"english",
        //     "languageCode":"en"
        // },
        "maxResolution": maxResolutionTier,
        "inputs": [
            {
                type: 'video',
                url: `${finalUrl}`,
            },
        ],
        "mp4Support": "capped_4k",
    }; 

    const fastpix = new Client({
        accessTokenId: credentials.publicKey ?? null,
        secretKey: credentials.secretKey ?? null,
    });

    try {
        const response = await fastpix.uploadMediaFromUrl(requestBody);

        if (response.success) {

            return { success: true, response: response };
            
        } else {

            return { success: false, statusCode: response.success ? 200 : response?.error?.code, message: response?.error?.message, fields: response?.error?.fields, payload: requestBody  };
        }
    } catch (error) {
        
        // @ts-ignore
        return { success: false, message: error?.message ?? "Failed to create media in fastpix" };
    }
};

const processVideosForPlatform = async (destinationPlatform: PlatformCredentials, videos: Videos[], productType: string) => {
    
    // @ts-ignore
    const createdMedia = [];
    
    // @ts-ignore
    const failedMedia = [];
 
    const createMediaPromises = videos.map((video) => {
 
        // handling mete data based on platform
        let metaData = [];
        if (productType === "amazon-s3") {
            metaData.push({"ETag": video.ETag})
        } else if (productType === "apivideo") {
            metaData.push({"tags": video.tags, "metaData": video.metadata})
        } else if (productType === "mux") {
            metaData.push({"passthrough": video?.passthrough})
        } else if (productType === "vimeo") {
            metaData.push({"tags": video?.tags, "metaData": video.metadata})
        }
   
        let mp4Url = video.mp4_url ?? null;
        let videoId= video.videoId ?? null;

        if (mp4Url !== "") {
            return createMediaInFastPix(destinationPlatform, mp4Url, videoId, metaData, productType).then((result) => ({
                videoId,
                ...result,
            }));
        } else {
            return Promise.resolve({
                videoId,
                success: false,
                message: "MP4 URL is 'none'",
            });
        }
    });

    const results = await Promise.allSettled(createMediaPromises);

    results.forEach((result) => {
        if (result?.status === "fulfilled") {
            if (result?.value?.success) {
                
                // @ts-ignore
                createdMedia.push(result?.value?.response);
            } else {
                
                // @ts-ignore
                failedMedia.push({ videoId: result?.value?.videoId, code: result?.value?.statusCode, message: result?.value?.message, fields: result?.value?.fields });
            }
        } else if (result.status === "rejected") {
            failedMedia.push({ videoId: null, error: result?.reason?.message ?? "Unknown error" });
        }
    });
    
    // @ts-ignore
    return { createdMedia, failedMedia };
};

export default processVideosForPlatform
