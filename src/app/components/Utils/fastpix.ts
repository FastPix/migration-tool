import { Fastpix } from "@fastpix/fastpix-node";
import { PlatformCredentials } from "./types";

interface Videos {
  passthrough?: string;
  videoId: string;
  mp4_url: string;
  tags?: Array<string>;
  metadata?: Array<string>;
  ETag?: string;
  // Optional, per-video explanation for why `mp4_url` is empty. Only the Vimeo
  // route populates it today; every other platform leaves it undefined and
  // falls back to the generic message below.
  unavailableReason?: string;
}

interface CreateResult {
  success: boolean;
  response?: unknown;
  statusCode?: number;
  message?: string;
  fields?: unknown;
  payload?: unknown;
}

// `mp4_support` here is actually the source video URL (parameter name kept
// for caller-position compatibility with the previous version). The on-wire
// `mp4Support` flag — which controls downloadable MP4 variants — is set to
// "capped_4k" further down.
const createMediaInFastPix = async (
  destinationPlatform: PlatformCredentials,
  mp4_support: string,
  videoId: string,
  metaData: Array<Record<string, unknown>>,
  productType: string,
): Promise<CreateResult> => {
  console.log(`[FastPix] Creating media for videoId=${videoId}, productType=${productType}, url=${mp4_support}`);
  const credentials = destinationPlatform?.credentials ?? null;
  if (!credentials?.publicKey || !credentials?.secretKey) {
    console.error("[FastPix] Missing credentials — publicKey or secretKey not provided");
    return {
      success: false,
      message: "Missing FastPix credentials (publicKey / secretKey)",
    };
  }

  const config = destinationPlatform?.config ?? null;
  const maxResolutionTier = config?.maxResolutionTier
    ? config.maxResolutionTier
    : "1080p";
  const playbackPolicy = config?.playbackPolicy?.[0];

  const cleanedUrl = mp4_support.trim();
  const finalUrl = cleanedUrl.replace(/\s+/g, ""); // Removes all whitespace

  // Per-platform metadata bundle — identical key shape to the previous SDK 1.x
  // body so any downstream consumer of `metadata` keeps reading the same fields.
  const platformMetadata: Record<string, string> = {
    originPlaformVideoId: videoId,
  };
  if (productType === "amazon-s3") {
    const eTag = (metaData?.[0] as { ETag?: string } | undefined)?.ETag;
    if (eTag != null) platformMetadata.ETag = eTag;
  } else if (productType === "apivideo" || productType === "vimeo") {
    const m0 = metaData?.[0] as
      | { tags?: unknown; metaData?: unknown }
      | undefined;
    platformMetadata.tags = JSON.stringify(m0?.tags ?? []);
    platformMetadata.metaData = JSON.stringify(m0?.metaData ?? {});
  } else if (productType === "mux") {
    const m0 = metaData?.[0] as { passthrough?: unknown } | undefined;
    platformMetadata.passthrough = JSON.stringify(m0?.passthrough ?? "");
  }

  const requestBody = {
    metadata: platformMetadata,
    accessPolicy: playbackPolicy,
    // subtitles: { languageName: "english", languageCode: "en" },
    maxResolution: maxResolutionTier,
    inputs: [
      {
        type: "video" as const,
        url: `${finalUrl}`,
      },
    ],
    mp4Support: "capped_4k",
  };

  // SDK 2.x: named export `Fastpix`, security goes under `security: { username, password }`
  // (was `{ accessTokenId, secretKey }` in 1.x — silently ignored by 2.x, which is
  // exactly why every request was returning 401 from FastPix). serverURL defaults
  // to https://api.fastpix.com/v1/.
  const fastpix = new Fastpix({
    security: {
      username: credentials.publicKey, // Access Token ID
      password: credentials.secretKey, // Secret Key
    },
  });

  try {
    // 2.x: `inputVideo.create` replaces 1.x `uploadMediaFromUrl`. Returns the
    // parsed response — on 2xx it includes `{ success: true, data: { id, ... } }`.
    const response = await fastpix.inputVideo.create(requestBody as never);

    console.log(`[FastPix] Media created successfully for videoId=${videoId}`, response);
    return { success: true, response };
  } catch (error: unknown) {
    // 2.x throws on non-2xx instead of returning `{ success: false }`. Parse the
    // upstream JSON body off the thrown error so the failed-videos table still
    // gets the `code` / `message` / `fields` triplet it used to read in 1.x.
    const e = error as {
      statusCode?: number;
      message?: string;
      body?: string;
    };

    let upstream:
      | { error?: { code?: number; message?: string; fields?: unknown } }
      | undefined;
    if (typeof e?.body === "string") {
      try {
        upstream = JSON.parse(e.body);
      } catch {
        /* not JSON — fall through */
      }
    }

    console.error(`[FastPix] Failed to create media for videoId=${videoId}`, {
      statusCode: upstream?.error?.code ?? e?.statusCode,
      message: upstream?.error?.message ?? e?.message,
      fields: upstream?.error?.fields,
    });
    return {
      success: false,
      statusCode: upstream?.error?.code ?? e?.statusCode,
      message:
        upstream?.error?.message ??
        e?.message ??
        "Failed to create media in fastpix",
      fields: upstream?.error?.fields,
      payload: requestBody,
    };
  }
};

const processVideosForPlatform = async (
  destinationPlatform: PlatformCredentials,
  videos: Videos[],
  productType: string,
) => {
  console.log(`[FastPix] Processing ${videos.length} video(s) from platform=${productType}`);
  const createdMedia: unknown[] = [];
  const failedMedia: Array<{
    videoId: string | null;
    code?: number;
    message?: string;
    fields?: unknown;
    error?: string;
  }> = [];

  const createMediaPromises = videos.map((video) => {
    // handling meta data based on platform
    const metaData: Array<Record<string, unknown>> = [];
    if (productType === "amazon-s3") {
      metaData.push({ ETag: video.ETag });
    } else if (productType === "apivideo") {
      metaData.push({ tags: video.tags, metaData: video.metadata });
    } else if (productType === "mux") {
      metaData.push({ passthrough: video?.passthrough });
    } else if (productType === "vimeo") {
      metaData.push({ tags: video?.tags, metaData: video.metadata });
    }

    const mp4Url = video.mp4_url ?? null;
    const videoId = video.videoId ?? null;

    if (mp4Url && mp4Url !== "") {
      return createMediaInFastPix(
        destinationPlatform,
        mp4Url,
        videoId,
        metaData,
        productType,
      ).then((result) => ({
        videoId,
        ...result,
      }));
    }
    return Promise.resolve({
      videoId,
      success: false as const,
      message: video.unavailableReason ?? "MP4 URL is 'none'",
    });
  });

  const results = await Promise.allSettled(createMediaPromises);

  results.forEach((result) => {
    if (result?.status === "fulfilled") {
      const value = result.value as {
        videoId: string | null;
        success: boolean;
        response?: unknown;
        statusCode?: number;
        message?: string;
        fields?: unknown;
      };
      if (value?.success) {
        createdMedia.push(value.response);
      } else {
        failedMedia.push({
          videoId: value.videoId,
          code: value.statusCode,
          message: value.message,
          fields: value.fields,
        });
      }
    } else if (result.status === "rejected") {
      failedMedia.push({
        videoId: null,
        error:
          (result.reason as { message?: string })?.message ?? "Unknown error",
      });
    }
  });

  console.log(`[FastPix] Processing complete — created=${createdMedia.length}, failed=${failedMedia.length}`);
  return { createdMedia, failedMedia };
};

export default processVideosForPlatform;
