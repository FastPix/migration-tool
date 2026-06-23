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
  const [platformName, setPlatformName] = useState(""); // to show heading name
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep); // for setting up current step
  const currentStep = useMigrationStore((state) => state.currentStep);  // current step
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform); // for setting up platform
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform); // for setting up platform
  const selectedPlatform = props?.type === "source" ? sourcePlatform : destinationPlatform; // to show form based on step
  const platform = currentStep === 'set-source-credentials' ? sourcePlatform : destinationPlatform;
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const [error, setError] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const platform = PLATFORM_CREDENTIALS.find(p => p.id === selectedPlatform?.id);

    if (platform) {
      setPlatformName(platform.name);
    } else {
      setPlatformName("");
    }
  }, [selectedPlatform]);

  // Validate that every required field for the selected platform is non-empty
  // (after trim). Catches whitespace-only paste, browser autofill quirks, and
  // any programmatic submit that bypassed the on-change disable logic.
  const validateRequiredFields = (rawData: Record<string, unknown>): Record<string, string> => {
    const platformDef = PLATFORM_CREDENTIALS.find(p => p.id === selectedPlatform?.id);
    const nextErrors: Record<string, string> = {};
    if (platformDef) {
      for (const field of platformDef.values) {
        const raw = rawData[field.name];
        const value = typeof raw === "string" ? raw.trim() : "";
        if (!value) {
          nextErrors[field.name] = `${field.label} is required`;
        }
      }
    }
    return nextErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    console.log(`[SourceCredentials] Submitting credentials for platform=${selectedPlatform?.id}, step=${currentStep}`);

    const nextErrors = validateRequiredFields(rawData);
    if (Object.keys(nextErrors).length > 0) {
      console.warn("[SourceCredentials] Validation failed:", nextErrors);
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setButtonDisabled(true);
    const { publicKey, secretKey, ...additionalMetadata } = rawData;
    const strippedPublicKey = typeof publicKey === "string" ? publicKey.trim() : "";
    const strippedSecreyKey = typeof secretKey === "string" ? secretKey.trim() : "";
    const data = { publicKey: strippedPublicKey, secretKey: strippedSecreyKey, additionalMetadata: { ...additionalMetadata, platformId: platform?.id } };

    console.log(`[SourceCredentials] Calling /apicalls/validatecredentials for platformId=${platform?.id}`);
    const result = await fetch("/apicalls/validatecredentials", {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.ok) {
      console.log(`[SourceCredentials] Credentials valid for platformId=${platform?.id}, step=${currentStep}`);
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
      console.error(`[SourceCredentials] Credential validation failed — status=${result.status}`);
      setError(true);
    }
  };

  const renderInputs = () => {
    const platform = PLATFORM_CREDENTIALS.find(p => p.id === selectedPlatform?.id);
    if (!platform) return null;

    return platform.values.map((input) => {
      const hasError = Boolean(fieldErrors[input.name]);
      const inputClass = `border rounded w-full max-w-[400px] h-[48px] p-2 ${hasError ? 'border-red-500 focus:outline-red-500' : ''}`;
      return (
        <div className="mb-4" key={input.name}>
          <label htmlFor={input.name} className="block mb-2 text-black text-[14px] font-normal">{input.label}:</label>
          {input.type === 'select' ? (
            <select id={input.name} name={input.name} className={inputClass} required aria-invalid={hasError}>
              {/* @ts-ignore */}
              {input.values.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input type={input.type} id={input.name} name={input.name} className={inputClass} required aria-invalid={hasError} />
          )}
          {hasError && (
            <p className="mt-1 text-red-500 text-[13px]" role="alert">{fieldErrors[input.name]}</p>
          )}
        </div>
      );
    });
  };

  const clearFieldError = (e) => {
    // Clear the field's own error as soon as the user starts editing it
    if (e.target?.name && fieldErrors[e.target.name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const handleKeyPairChange = (e) => {
    if (e.target.id === "secretKey") {
      setButtonDisabled(!(publicKey !== "" && e.target.value !== ""));
      setSecretKey(e.target.value);
    } else if (e.target.id === "publicKey") {
      setButtonDisabled(!(e.target.value !== "" && secretKey !== ""));
      setPublicKey(e.target.value);
    }
  };

  const handleApiVideoChange = (e) => {
    if (e.target.id === "secretKey") {
      setButtonDisabled(e.target.value === "");
      setPublicKey(e.target.value);
    }
  };

  const handleS3Change = (e) => {
    if (e.target.id === "secretKey") {
      setButtonDisabled(!(publicKey !== "" && e.target.value !== "" && bucketName !== ""));
      setSecretKey(e.target.value);
    } else if (e.target.id === "publicKey") {
      setButtonDisabled(!(e.target.value !== "" && secretKey !== "" && bucketName !== ""));
      setPublicKey(e.target.value);
    } else if (e.target.id === "bucket") {
      setButtonDisabled(!(e.target.value !== "" && secretKey !== "" && publicKey !== ""));
      setBucketName(e.target.value);
    }
  };

  const handleVimeoChange = (e) => {
    if (e.target.id === "secretKey") {
      setButtonDisabled(e.target.value === "");
      setSecretKey(e.target.value);
    }
  };

  const getOnChangeEvents = (e) => {
    setError(false);
    clearFieldError(e);

    // @ts-ignore
    switch (selectedPlatform.id) {
      case "mux":
      case "fastPix":
      case "cloudflare-stream":
        handleKeyPairChange(e);
        break;
      case "api-video":
        handleApiVideoChange(e);
        break;
      case "s3":
        handleS3Change(e);
        break;
      case "vimeo":
        handleVimeoChange(e);
        break;
      default:
        return null;
    }
  }

  const setNotificationClose = (value: boolean) => {
    
    // @ts-ignore
    setError(value);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="p-4" onChange={(e) => getOnChangeEvents(e)}>
        <Heading>Enter your {platformName} Credentials</Heading>
        <p className="text-slate-gray font-normal text-[15px] py-[10px]">Your credentials are stored locally and encrypted in transit.</p>
        {renderInputs()}
        <button type="submit" disabled={buttonDisabled} className={`${buttonDisabled ? "opacity-[50%] bg-black cursor-not-allowed" : "hover:cursor-pointer"} mt-4 bg-black hover:bg-gray-800 text-white w-full max-w-[400px] h-[48px] rounded p-[12px]`}>
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
