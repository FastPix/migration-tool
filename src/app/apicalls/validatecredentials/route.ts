import Mux from "@mux/mux-node";
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

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
  const endpoint = data.additionalMetadata?.environment === 'sandbox'
    ? "https://sandbox.api.video"
    : "https://ws.api.video";

  try {
    const response = await fetch(`${endpoint}/videos`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(data.secretKey as string)}`,
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
  const endpoint = "https://v1.fastpix.io/on-demand";

  try {
    const response = await fetch(`${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${data.publicKey}:${data.secretKey}`)}`,
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

  switch (data.additionalMetadata?.platformId) {
    case 'api-video':
      return await verifyApiVideo(data);

    case 'cloudflare-stream': {
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
      const client = new S3Client({
        credentials: {
          accessKeyId: data.publicKey,
          secretAccessKey: data.secretKey!,
        },
        region: data.additionalMetadata.region,
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
