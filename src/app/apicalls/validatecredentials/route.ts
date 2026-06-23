import Mux from "@mux/mux-node";
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getBucketRegion } from "../s3Utils";

interface AdditionalMetaData {
  environment?: string;
  platformId: string;
  region?: string;
  bucket?: string;
}

interface VideoPlatformCredentails {
  publicKey: string;
  secretKey: string;
  additionalMetadata: AdditionalMetaData;
}

// Verify API Video Credentials
async function verifyApiVideo(data: VideoPlatformCredentails) {
  console.log("[ValidateCredentials] Verifying API Video credentials");
  const endpoint = data.additionalMetadata?.environment === 'sandbox'
    ? "https://sandbox.api.video"
    : "https://ws.api.video";

  try {
    const response = await fetch(`${endpoint}/videos`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(data.secretKey)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.data) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// Verify FastPix Credentials
async function verifyFastPix(data: VideoPlatformCredentails) {
  console.log("[ValidateCredentials] Verifying FastPix credentials");
  const endpoint = "https://api.fastpix.com/v1/on-demand";

  const credentials = `${data.publicKey}:${data.secretKey}`;

  try {
    const response = await fetch(`${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(credentials)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.data) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// Verify Vimeo Credentials
async function verifyVimeo(data: VideoPlatformCredentails) {
  console.log("[ValidateCredentials] Verifying Vimeo credentials");
  const endpoint = "https://api.vimeo.com";

  try {
    const response = await fetch(`${endpoint}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// POST Handler
export async function POST(request: Request) {
  const data: VideoPlatformCredentails = await request.json();
  console.log(`[ValidateCredentials POST] Validating credentials for platformId=${data.additionalMetadata?.platformId}`);

  switch (data.additionalMetadata?.platformId) {
    case 'api-video':
      return await verifyApiVideo(data);

    case 'cloudflare-stream': {
      console.log("[ValidateCredentials] Verifying Cloudflare Stream credentials");
      try {
        const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: {
            Authorization: `Bearer ${data.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const valiadteAccountid = await fetch(`https://api.cloudflare.com/client/v4/accounts/${data?.publicKey}/stream`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${data?.secretKey ? data.secretKey : null}`,
              'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        const validateId = await valiadteAccountid.json()

        if (result.success && validateId.success !== false) {
          return new Response('ok', { status: 200 });
        } else {
          return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }
      } catch {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    case 's3': {
      console.log("[ValidateCredentials] Verifying Amazon S3 credentials");
      const bucketUrl = `https://${data.additionalMetadata.bucket}.s3.amazonaws.com`;
      const region = await getBucketRegion(bucketUrl);

      const client = new S3Client({
        credentials: {
          accessKeyId: data.publicKey,
          secretAccessKey: data.secretKey,
        },
        region: region,
      });

      const input = {
        Bucket: data.additionalMetadata.bucket.trim(),
      };

      const command = new HeadBucketCommand(input);

      try {
        await client.send(command);
        return new Response('ok', { status: 200 });
      } catch {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    case 'mux': {
      console.log("[ValidateCredentials] Verifying Mux credentials");
      const mux = new Mux({
        tokenId: data.publicKey,
        tokenSecret: data.secretKey,
      });

      try {
        await mux.video.assets.list();
        return new Response('ok', { status: 200 });
      } catch {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    case 'vimeo':
      return await verifyVimeo(data);

    case 'fastPix':
      return await verifyFastPix(data);

    default:
      return Response.json({ error: 'Invalid platform provided' }, { status: 404 });
  }
}
