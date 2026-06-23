import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type MigrationStep =
  | 'select-source'
  | 'set-source-credentials'
  | 'set-video-filter'
  | 'select-videos'
  | 'select-destination'
  | 'set-destination-credentials'
  | 'set-import-settings'
  | 'review'
  | 'migration-status';

type Platform = {
  id: string;
  name: string;
  logo: string;
  credentials?: {
    publicKey: string;
    secretKey?: string;
  };
};

type Video = {
  id: string;
  url?: string;
  title?: string;
  thumbnailUrl?: string;
};

interface MigrationState {
  sourcePlatform: Platform | null;
  destinationPlatform: Platform | null;
  videoOptions: string[] | null;
  assetFilter: string[] | null;
  originVideosList: Video[];
  currentStep: MigrationStep;
  isVideosMigrating: boolean;
}

type MigrationActions = {
  setCurrentStep: (step: MigrationStep) => void;
  setAssetFilter: (filter: string[] | null) => void;
  setPlatform: (type: 'source' | 'destination', platform: Platform | null) => void;
  setOriginVideos: (videos: Video[]) => void;
  setIsVideosMigrating: (value: boolean) => void;
  setMigrationError: (error: Error[]) => void;
};

interface Error {
  success: boolean,
  status: string,
  message: string
}

interface FailedVideo {
  videoId: string,
  code: string,
  message: string,
  fields: any
}

const useMigrationStore = create<MigrationState & MigrationActions>()(
  persist(
    immer((set) => ({
      sourcePlatform: null,
      destinationPlatform: null,
      videoOptions: null,
      assetFilter: null,
      originVideosList: [],
      currentStep: 'select-source',
      isVideosMigrating: false,
      migrationError: {},
      failedVideos: [],

      setCurrentStep: (step: MigrationStep) => {
        console.log(`[Store] Step changed → ${step}`);
        set({ currentStep: step });
      },

      setAssetFilter: (filter: string[] | null) => {
        console.log("[Store] Asset filter set:", filter);
        set({ assetFilter: filter });
      },

      setPlatform: (type: 'source' | 'destination', platform: Platform | null) => {
        console.log(`[Store] Platform set — type=${type}, id=${platform?.id ?? "null"}`);
        if (type === 'source') {
          set({ sourcePlatform: platform });
        } else {
          set({ destinationPlatform: platform });
        }
      },

      setOriginVideos: (videos: Video[]) => {
        console.log(`[Store] Origin videos set — count=${videos.length}`);
        set({ originVideosList: videos });
        set({ isVideosMigrating: false });
      },

      setIsVideosMigrating: (value: boolean) => {
        console.log(`[Store] isVideosMigrating → ${value}`);
        set({ isVideosMigrating: value });
      },

      setMigrationError: (error: Error[]) => {
        console.error("[Store] Migration error set:", error);
        // @ts-ignore
        set({ migrationError: error });
      },

      setFailedVideos: (videos: FailedVideo[])=> {
        console.log(`[Store] Failed videos set — count=${videos.length}`, videos);
        // @ts-ignore
       set({failedVideos: videos})
      }
    })),
    {
      name: 'fp-migration-storage',
    }
  )
);

export default useMigrationStore;
