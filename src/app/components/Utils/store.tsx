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
  success: Boolean,
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
        set({ currentStep: step });
      },

      setAssetFilter: (filter: string[] | null) => {
        set({ assetFilter: filter });
      },

      setPlatform: (type: 'source' | 'destination', platform: Platform | null) => {
        if (type === 'source') {
          set({ sourcePlatform: platform });
        } else {
          set({ destinationPlatform: platform });
        }
      },

      setOriginVideos: (videos: Video[]) => {
        set({ originVideosList: videos });
        set({ isVideosMigrating: false });
      },

      setIsVideosMigrating: (value: boolean) => {
        set({ isVideosMigrating: value });
      },

      setMigrationError: (error: Error[]) => {
        
        {/* @ts-ignore */}
        set({ migrationError: error });
      },

      setFailedVideos: (videos: FailedVideo[])=> {
        
        {/* @ts-ignore */}
       set({failedVideos: videos})
      }
    })),
    {
      name: 'fp-migration-storage',
    }
  )
);

export default useMigrationStore;
