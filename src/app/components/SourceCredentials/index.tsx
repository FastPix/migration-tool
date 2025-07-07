import { useEffect, useState } from "react";

import Heading from "../Heading";
import useMigrationStore from "../Utils/store";
import Notification from "../Notification";

interface Form {
  type: string
}

const PLATFORM_CREDENTIALS = [
  {
    name: 'Amazon S3',
    id: 's3',
    values: [
      { label: 'Access Key ID', name: 'publicKey', type: 'text' },
      { label: 'Secret Access Key', name: 'secretKey', type: 'text' },
      // { label: 'Region', name: 'region', type: 'select', 
      // values: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1', 'us-east-2', 'af-south-1', 'ap-east-1', 'ap-south-2', 'ap-southeast-3', 'ap-southeast-5',
      //   'ap-southeast-4', 'ap-south-1', 'ap-northeast-3', 'ap-northeast-2', 'ap-east-2', 'ap-southeast-7', 'ap-northeast-1', 'ca-central-1', 'ca-west-1', 'eu-west-2', 'eu-south-1', 'eu-west-3', 'eu-south-2', 'eu-north-1', 'eu-central-2', 'il-central-1',
      //   'mx-central-1', 'me-south-1', 'me-central-1', 'sa-east-1'
      // ] },
      { label: 'Bucket name', name: 'bucket', type: 'text' },
    ],
  },
  {
    name: 'Api.video',
    id: 'api-video',
    values: [
      { label: 'API Key', name: 'secretKey', type: 'text' },
      { label: 'Environment', name: 'environment', type: 'select', values: ['sandbox', 'production'] },
    ],
  },
  {
    name: 'Cloudflare Stream',
    id: 'cloudflare-stream',
    values: [
      { label: 'Account ID', name: 'publicKey', type: 'text' },
      { label: 'API Token', name: 'secretKey', type: 'text' },
    ],
  },
  {
    name: 'Mux',
    id: 'mux',
    values: [
      { label: 'Access Token ID', name: 'publicKey', type: 'text' },
      { label: 'Secret Key', name: 'secretKey', type: 'text' },
    ],
  },
  {
    name: 'FastPix',
    id: 'fastPix',
    values: [
      { label: 'Access Token ID', name: 'publicKey', type: 'text' },
      { label: 'Access Token Secret', name: 'secretKey', type: 'text' },
    ],
  },
  {
    name: 'Vimeo',
    id: 'vimeo',
    values: [
      { label: 'Secret Key', name: 'secretKey', type: 'text' },
    ],
  },
];

const PlatformForm = (props: Form) => {
  const selectedPlatform = props?.type === "source" ? useMigrationStore((state) => state.sourcePlatform) : useMigrationStore((state) => state.destinationPlatform); // to show form based on step
  const [platformName, setPlatformName] = useState(""); // to show heading name
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep); // for setting up current step
  const currentStep = useMigrationStore((state) => state.currentStep);  // current step
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform); // for setting up platform
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform); // for setting up platform
  const platform = currentStep === 'set-source-credentials' ? sourcePlatform : destinationPlatform;
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const [error, setError] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [bucketName, setBucketName] = useState("");

  useEffect(() => {
    const platform = PLATFORM_CREDENTIALS.find(p => p.id === selectedPlatform?.id);

    if (platform) {
      setPlatformName(platform.name);
    } else {
      setPlatformName("");
    }
  }, [selectedPlatform]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setButtonDisabled(true);
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    const { publicKey, secretKey, ...additionalMetadata } = rawData;
    const strippedPublicKey = publicKey ? publicKey.trim() : "";
    const strippedSecreyKey = secretKey ? secretKey.trim() : "";
    const data = { publicKey: strippedPublicKey, secretKey: strippedSecreyKey, additionalMetadata: { ...additionalMetadata, platformId: platform?.id } };

    const result = await fetch("/apicalls/validatecredentials", {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.ok) {
      if (currentStep === 'set-source-credentials') {
        
        // @ts-ignore
        setPlatform("source", { ...platform, credentials: data });
        setCurrentStep('set-video-filter');
      } else if (currentStep === 'set-destination-credentials') {
        
        // @ts-ignore
        setPlatform("destination", { ...platform, credentials: data });
        setCurrentStep('set-import-settings');
      }
    } else {
      setError(true);
    }
  };

  const renderInputs = () => {
    const platform = PLATFORM_CREDENTIALS.find(p => p.id === selectedPlatform?.id);
    if (!platform) return null;

    return platform.values.map((input, index) => (
      <div className="mb-4" key={index}>
        <label htmlFor={input.name} className="block mb-2 text-black text-[14px] font-normal">{input.label}:</label>
        {input.type === 'select' ? (
          <select id={input.name} name={input.name} className="border rounded w-full max-w-[400px] h-[48px] p-2" required>
            
            {/* @ts-ignore */}
            {input.values.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input type={input.type} id={input.name} name={input.name} className="border rounded w-full max-w-[400px] h-[48px] p-2" required />
        )}
      </div>
    ));
  };

  const getOnChangeEvents = (e) => {
    setError(false);
     
    // @ts-ignore
    switch (selectedPlatform.id) {
      case "mux":
      case "fastPix":
      case "cloudflare-stream":
        if (e.target.id === "secretKey") {
          publicKey !== "" && e.target.value !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setSecretKey(e.target.value);
        } else if (e.target.id === "publicKey") {
          e.target.value !== "" && secretKey !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setPublicKey(e.target.value);
        }
        break;

      case "api-video":
        if (e.target.id === "secretKey") {
          e.target.value !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setPublicKey(e.target.value);
        }
        break;

      case "s3":
        if (e.target.id === "secretKey") {
          publicKey !== "" && e.target.value !== "" && bucketName !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setSecretKey(e.target.value);
        } else if (e.target.id === "publicKey") {
          e.target.value !== "" && secretKey !== "" && bucketName !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setPublicKey(e.target.value);
        } else if (e.target.id === "bucket") {
          e.target.value !== "" && secretKey !== "" && publicKey !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setBucketName(e.target.value);
        }
        break;

      case "vimeo":
        if (e.target.id === "secretKey") {
          e.target.value !== "" ? setButtonDisabled(false) : setButtonDisabled(true);
          setSecretKey(e.target.value);
        }
        break
      default:

        return null
    }
  }

  const setNotificationClose = (value: Boolean) => {
    
    // @ts-ignore
    setError(value);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="p-4" onChange={(e) => getOnChangeEvents(e)}>
        <Heading>Enter your {platformName} Credentials</Heading>
        <p className="text-slate-gray font-normal text-[15px] py-[10px]">Your credentials are stored locally and encrypted in transit.</p>
        {renderInputs()}
        <button type="submit" disabled={buttonDisabled} className={`${buttonDisabled ? "opacity-[50%] bg-black" : "hover:cursor-pointer"} mt-4 bg-black hover:bg-gray-800 text-white w-full max-w-[400px] h-[48px] rounded p-[12px]`}>
          Verify Credentials
        </button>
      </form>
      {
        error ? (
          <Notification
            variant="error"
            title="Invalid Credentials"
            description="Please verify your credentials and try again."
            onClose={() => setNotificationClose(false)}
          />
        ) : ""
      }
    </>
  );
};

export default PlatformForm;
