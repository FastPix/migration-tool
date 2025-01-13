import Heading from '../Heading';
import useMigrationStore from '../Utils/store';

const VideoOptions = () => {
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const setAssetFilter = useMigrationStore((state) => state.setAssetFilter);

  return (
    <div className="py-[15px]">
      <div className="px-4">
        <Heading>Select your videos</Heading>
        <p className="font-normal text-[15px] pt-[5px]">What specific items do you wish to migrate?</p>
      </div>

      <div className="flex p-4">
        <button
          className="py-[12px] px-[16px] bg-black hover:bg-gray-800 text-white rounded-lg"
          onClick={() => {
            setAssetFilter([]);
            setCurrentStep('select-destination');
          }}
        >
          Transfer Everything
        </button>
        <div className='flex flex-col items-center opacity-35'>
          <button
            disabled
            className="py-[12px] px-[16px] w-[150px] bg-white text-black border border-black ml-[20px] rounded-lg group"
          >
            <span className="text-[12px] font-normal group-hover:hidden">Let me choose</span>
            <span className="text-[12px] font-normal hidden group-hover:inline">Coming soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoOptions
