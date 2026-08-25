import FailedIcon from "../Icons/FailedIcon";

export default function FailedVideos({ failedVideos }) {

    return (
        <div className="w-full">
            <div className="grid grid-cols-[50px_2fr_1fr_1fr] bg-pale-silver static top-0">
                <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">SL.NO</div>
                <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">VIDEO ID</div>
                <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">STATUS CODE</div>
                <div className="px-4 text-[12px] text-grayish-blue py-2 text-left">ERROR MESSAGE</div>
            </div>

            {failedVideos?.map((video, index) => (
                <div
                    key={video?.videoId ?? `${video?.code}-${video?.message}`}
                    className="border-b last:border-none overflow-hidden"
                >
                    <div className="grid grid-cols-[50px_2fr_1fr_1fr] bg-white m-2">
                        <div className="px-4 py-2 text-[12px] text-left">{index + 1}</div>
                        <div className="px-4 py-2 text-[12px] text-left">{video?.videoId ?? null}</div>
                        <div className="px-4 py-2 text-[12px] text-left">{video?.code ?? "\u2014"}</div>
                        <div className="px-4 py-2 text-[12px] text-left flex gap-x-2 bg-blush-pink rounded">
                            <span className="text-crimson-red"><FailedIcon /></span>
                            <span className="text-crimson-red font-semibold">{video?.message ?? null}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
