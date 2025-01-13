interface MetaData {
    environment: string;
    platformId: string;
    bucket?: string;
    region?: string;
}

interface LogoImage {
    key: null;
    props: Record<string, string>;
    _owner?: string;
    _store?: Record<string, string>;
}

interface Credentials {
    publicKey: string;
    secretKey: string;
    logo?: LogoImage;
    additionalMetadata: MetaData;
    accessKeyId: string;
    secretAccessKey: string;
}

interface VideoConfig {
    maxResolutionTier?: string;
    encodingTier?: string;
    playbackPolicy: Array<string>;
}

export interface PlatformCredentials {
    id: string;
    name: string;
    credentials: Credentials;
    config?: VideoConfig;
}
