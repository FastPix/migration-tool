import { useState } from 'react';
import Heading from '../Heading';
import useMigrationStore from '../Utils/store';

const platformOptions = [
  {
    id: 'fastPix',
    fields: [
      {
        label: 'Encoding tier',
        description: 'The encoding tier informs the cost, quality, and available platform features for the asset.',
        docsUrl: '',
        name: 'encodingTier',
        type: 'select',
        values: ["smart"]
      },
      {
        label: 'Max resolution tier',
        description:'This field controls the maximum resolution that FastPix will encode, store, and deliver your media in. FastPix does not to automatically ingest content at 4K so that you can avoid unexpectedly high ingest bills.',
        docsUrl: '',
        name: 'maxResolutionTier',
        type: 'select',
        values: ["480p", "720p", "1080p", '1440p', '2160p']
      },
      {
        label: 'Playback policy',
        description: 'Playback policies allow you to control the different ways users can view and interact with your content.',
        docsUrl: '',
        name: 'playbackPolicy',
        type: 'multi-checkbox',
        values: ['public', 'private'],
      },
    ],
  },
];

const VideoSettings = () => {
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const platform = useMigrationStore((state) =>
    state.currentStep === 'set-import-settings' ? state.destinationPlatform : state.sourcePlatform
  );
  const [config, setConfig] = useState({ encodingTier: 'smart',  playbackPolicy: ["public"],  maxResolutionTier: "480p" });

  if (!platform) {
    return null;
  }

  const platformFields = platformOptions.find((field) => field.id === destinationPlatform?.id);
  
  // @ts-ignore
  const handleCheckboxChange = (field, value) => {
    const updatedConfig = value ? { ...config, [field.name]: '1' } : { ...config };
    if (!value) {

      // @ts-ignore
      delete updatedConfig[field.name];
    }
    setConfig(updatedConfig);
  };

  // @ts-ignore
  const handleMultiCheckboxChange = (field, value) => {
    if (field.name === 'playbackPolicy') {
      const updatedConfig = { ...config, [field.name]: [value.optionValue] };
      setConfig(updatedConfig);
      return;
    }

    // @ts-ignore
    let newArray = config[field.name] || [];
    if (value.checked) {
      newArray = [...newArray, value.optionValue];
    } else {
      newArray = newArray.filter((item) => item !== value.optionValue);
    }
    const updatedConfig = newArray.length > 0 ? { ...config, [field.name]: newArray } : { ...config };
    if (newArray.length === 0) {

      // @ts-ignore
      delete updatedConfig[field.name];
    }
    setConfig(updatedConfig);
  };

  // @ts-ignore
  const handleFieldChange = (field, value) => {
    console.log(`[VideoSettings] Field changed — name=${field.name}, value=`, value);
    if (field.type === 'checkbox') {
      handleCheckboxChange(field, value);
    } else if (field.type === 'multi-checkbox' || field.name === 'playbackPolicy') {
      handleMultiCheckboxChange(field, value);
    } else {
      setConfig({ ...config, [field.name]: value });
    }
  };

  // @ts-ignore
  const onSubmit = async (e) => {
    e.preventDefault();
    console.log("[VideoSettings] Import settings confirmed:", config);
    // @ts-ignore
    setPlatform(platform.type, { ...platform, config });
    setCurrentStep('review');
  };

  return (
    <div className="p-4">
      <form onSubmit={onSubmit}>
        <Heading>Choose your import settings</Heading>

        <div className="flex flex-col gap-4 mb-10 mt-[20px]">
          {platformFields?.fields.map((field) => {
            
            // @ts-ignore
            if (field.visible && !field.visible(config)) {
              return null;
            }

            const fieldId = `field-${field.name}`;
            return (
              <div key={field.name}>
                {field.type === 'select' && (
                  <div className="sm:col-span-3">
                    <label htmlFor={fieldId} className="block text-black text-[12px] leading-[12px] font-[400] my-[10px]">
                      {field.label}
                    </label>
                    <select
                      id={fieldId}
                      name={field.name}
                      
                      // @ts-ignore
                      value={config[field.name] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="block w-full border border-light-grayish-lavender rounded-[8px] max-w-[400px] py-[14px] px-[16px] text-gray-900 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      {field.values &&
                      
                      // @ts-ignore
                        (typeof field.values === 'function' ? field.values(config) : field.values).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                    </select>
                    {(field.description || field.docsUrl) && (
                      <p className="text-gray-500 text-[15px] font-[400] leading-[22.5px] mt-2 max-w-[400px]">
                        {field.description}
                        {field.docsUrl && (
                          <>
                            {' '}
                            <a
                              href={field.docsUrl}
                              target="_blank"
                              className="underline hover:no-underline focus:no-underline"
                            >
                              Read more
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div>
                    <div className="flex gap-x-3">
                      <div className="flex h-6 items-center">
                        <input
                          id={fieldId}
                          name={field.name}
                          type="checkbox"
                          
                          // @ts-ignore
                          checked={!!config[field.name]}
                          onChange={(e) => handleFieldChange(field, e.target.checked)}
                          className="h-4 w-4 rounded border border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label htmlFor={fieldId} className="font-medium text-gray-900">
                          {field.label}
                        </label>
                      </div>
                    </div>
                    {(field.description || field.docsUrl) && (
                      <p className="text-gray-500 text-[15px] font-[400] leading-[22.5px] mt-1 max-w-[400px]">
                        {field.description}
                        {field.docsUrl && (
                          <>
                            {' '}
                            <a
                              href={field.docsUrl}
                              target="_blank"
                              className="underline hover:no-underline focus:no-underline"
                            >
                              Read more
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {field.type === 'multi-checkbox' && (
                  <div>
                    <fieldset className="text-sm">
                      <legend className="block text-black text-[12px] leading-[12px] font-[400]">{field.label}</legend>
                      <div className="mt-2 flex flex-col sm:flex-row gap-y-4 gap-x-3">
                        {field.values &&
                        
                        // @ts-ignore
                          (typeof field.values === 'function' ? field.values(config) : field.values).map((value) => (
                            <div key={value} className="flex items-center">
                              <input
                                id={`${fieldId}-${value}`}
                                name={field.name}
                                value={value}
                                type="checkbox"
                                
                                // @ts-ignore
                                checked={(config[field.name] || []).includes(value)}
                                onChange={(e) =>
                                  handleFieldChange(field, { optionValue: e.target.value, checked: e.target.checked })
                                }
                                className="h-4 w-4 rounded border border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                              <label htmlFor={value} className="ml-3 min-w-0">
                                {value}
                              </label>
                            </div>
                          ))}
                      </div>
                    </fieldset>
                    <p className="text-gray-500 text-[15px] font-[400] leading-[22.5px] mt-2 max-w-[400px]">
                      {field.description}
                      {field.docsUrl && (
                        <>
                          {' '}
                          <a
                            href={field.docsUrl}
                            target="_blank"
                            className="underline hover:no-underline focus:no-underline"
                          >
                            Read more
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {field.type === 'text' && (
                  <div>
                    <label htmlFor={fieldId} className="block text-black text-[12px] leading-[12px] font-[400]">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      id={fieldId}
                      name={field.name}
                      
                      // @ts-ignore
                      value={config[field.name] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      
                      className="mt-1 block w-full border-light-grayish-lavender rounded-[8px] max-w-[400px] py-[14px] px-[16px] focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    />
                    <p className="mt-2 text-[15px] font-[400] leading-[22.5px] text-gray-500">
                      {field.description}{' '}
                      <a href={field.docsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Read more
                      </a>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="inline-flex justify-center py-[12px] px-[16px] border border-transparent text-sm font-medium rounded-md text-white bg-black max-w-[170px] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Confirm and review
        </button>
      </form>
    </div>
  );
}

export default VideoSettings;
