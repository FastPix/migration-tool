import React from "react";
import Heading from "../Heading";
import CreatedIcon from "../Icons/CreatedIcon";
import useMigrationStore from "../Utils/store";
import Loading from "../Loading";
import ErrorUI from "../ErrorUI";
import FailedVideos from "../FailedVideos";

export interface PlaybackId {
    id: string;
    accessPolicy: string;
}

export interface Metadata {
    muxMediaId: string;
}

export interface VideoData {
    id: string;
    trial: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    playbackIds: PlaybackId[];
    metadata: Metadata;
    mp4Support: string;
    maxResolution: string;
}

export interface OriginVideo {
    data: VideoData;
}

const MigrationStatus: React.FC = () => {
    const originPlatformVideos = useMigrationStore((state) => state.originVideosList) as unknown as OriginVideo[] | undefined;
    const isVideosMigrating = useMigrationStore((state) => state.isVideosMigrating);
    
    // @ts-ignore
    const migrationError = useMigrationStore((state) => state.migrationError);
    
    // @ts-ignore
    const failedVideos = useMigrationStore((state) => state.failedVideos);

    return (
        <div className="p-2">
            <Heading>REVIEW</Heading>

            <p className="mt-[10px]">Before the big move, there&apos;s one</p>

            {isVideosMigrating ? (
                <div className="max-w-[900px] overflow-auto gap-y-4 flex flex-col justify-center items-center mt-[40px] h-[60vh]">
                    <h2 className="text-xl md:text-xl font-semibold">Videos are currently migrating. Please stay on this page, as the process may take a few moments.</h2>
                    <Loading />
                </div>
            ) : (
                <>
                <h2 className={`my-4 ${failedVideos.length >= 1 ? "font-bold block" : "hidden"}`}>Failed Videos List</h2>
                <div className="max-w-[900px]">
                    <div className="overflow-x-auto my-[20px] rounded-lg border border-light-grayish-blue max-h-[500px]">
                        <div className={`grid grid-cols-[1fr_2fr_1fr] bg-pale-silver static top-0 ${failedVideos?.length === 0 ? "" : "hidden"}`}>
                            <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">SL.NO</div>
                            <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">VIDEO ID</div>
                            <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">STATUS</div>
                        </div>

                        {
                            migrationError?.[0]?.success === true ?
                                (
                                    <ErrorUI title={migrationError?.[0]?.message} code={migrationError?.[0]?.status} />
                                )
                                : ""
                        }

                        {originPlatformVideos?.map((video, index) =>
                            video?.data?.id ? (
                                <div key={video.data.id} className="grid grid-cols-[1fr_2fr_1fr] border">
                                    <div className="px-4 py-2 text-[14px]">{index + 1}</div>
                                    <div className="px-4 py-2 text-[14px]">{video?.data?.id}</div>
                                    <div className="px-4 py-2 text-[14px]">
                                        <div className="bg-baby-blue w-[120px] p-[5px] flex gap-x-2 items-center rounded-lg">
                                            <span><CreatedIcon /></span>
                                            <span className="text-cobalt-blue text-[12px]">CREATED</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        )}

                        {failedVideos?.length >= 1 ? (
                            <FailedVideos failedVideos={failedVideos} />
                        ) : ""}
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default MigrationStatus;
