'use client';

import { Inter } from 'next/font/google'

import Header from "./components/Header";
import Footer from "./components/Footer";
import MigrationStatus from "./components/Migration";
import PlatformList from "./components/PlatformList";
import Review from "./components/Review";
import SideBar from "./components/SideBar";
import PlatformForm from "./components/SourceCredentials";
import useMigrationStore from "./components/Utils/store";
import VideoOptions from "./components/VideoOptions";
import VideoSettings from "./components/VideoSettings";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const Home = () => {
  const currentStep = useMigrationStore((state) => state.currentStep);

  return (
    <div className={`flex flex-col h-screen font-inter ${inter.className}`}>
      <Header />
      <div className="md:flex lg:h-screen">
        <div className="w-full md:max-w-[25%] mr-[2%] border-r border-light-grayish-blue">
          <SideBar />
        </div>
          <div className="flex flex-grow flex-col justify-between w-full overflow-auto">
            {
              currentStep === "select-source" ? (
                <PlatformList type="source" />
              ) : currentStep === "set-source-credentials" ? (
                <PlatformForm type="source" />
              ) : currentStep === "set-video-filter" ? (
                <VideoOptions />
              ) : currentStep === "select-destination" ? (
                <PlatformList type="destination" />
              ) : currentStep === "set-destination-credentials" ? (
                <PlatformForm type="destination" />
              ) : currentStep === "set-import-settings" ?
                <VideoSettings /> : currentStep === "review" ? <Review /> : currentStep === "migration-status" ? <MigrationStatus /> : ""
            }
            <Footer />
        </div>
      </div>
    </div>
  );
};

export default Home;
