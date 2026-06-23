import { useEffect, useState } from "react";

import ReactPortal from "../ReactPortal";
import CheckCircleFillIcon from "../Icons/CheckCircleFillIcon";
import ErrorCircleFillIcon from "../Icons/ErrorCircleFillIcon";
import CloseIcon from "../Icons/CloseIcon";

interface NotificationInterface {
  title?: string;
  description?: string;
  code?: number;
  variant: "primary" | "secondary" | "success" | "warning" | "error";
  onClose: (event: React.MouseEvent<HTMLButtonElement>) => void;
  duration?: number
}

const Notification = (props: NotificationInterface) => {
  const defualtDuration = 4000;
  const [toggleNotification, setToggleNotification] = useState<boolean | null>(null);

  useEffect(() => {
    let notificationTimeout:any;
    setToggleNotification(true);

    // Close notification after duration
    notificationTimeout = setTimeout(() => {
      setToggleNotification(false);
    }, (props.duration - 400) || (defualtDuration - 400));

    notificationTimeout = setTimeout(() => {
      setToggleNotification(false);
      
      // @ts-ignore
      props.onClose();
    }, props.duration || defualtDuration);

    return(() => {
      setToggleNotification(null);
      clearTimeout(notificationTimeout);
    });
  }, []);

  const notificationUi = () => {
    switch (props.variant) {

    case "success":
      return (
        <div className="full-width px-15 py-4  bg-custom-white shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-[10px] relative flex items-stretch gap-x-[10px] border border-[rgba(12,177,109,0.8)] animate slideFromRight">
          <div className="w-[6px] h-[88px] rounded-[10px] bg-success" />
          <div className="w-[calc(100%_-_26px)] flex items-center">
            <div className="w-[32px] h-[32px] text-success inline-flex items-center  justify-center">
              <CheckCircleFillIcon />
            </div>
            <div className="w-[calc(100%_-_32px)] py-1 pl-1">
              <div className="w-full text-[14px] text-black font-medium first-letter:capitalize">
                {
                  props.code ? <span className="hidden"><pre className="font-mono bg-success-light text-success py-[4px] px-[8px] rounded mr-1 inline-block">{props.code}</pre></span>: ""
                }
                <span className="inline">{props.title}</span>
              </div>
              <div className="w-full text-[12px] text-black mt-[6px] first-letter:capitalize">{props.description}
              </div>
            </div>
          </div>
          <div className="w-[20px] justify-end relative">
            
            {/* @ts-ignore */}
            <button width="20px" height="20px" onClick={props.onClose} className=" absolute w-[20px] h-[20px] flex items-center justify-center">
              <span className="w-[14px] h-[14px] absolute top-[15px]"><CloseIcon /></span>
            </button>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="full-width px-15 py-2 h-[80px] bg-custom-white shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-[10px] relative flex items-stretch gap-x-[10px] border border-[rgba(226,14,14,0.8)]">
          <div className="w-[6px] rounded-[10px] bg-error" />
          <div className="w-[calc(100%_-_26px)] flex items-center">
            <div className="w-[32px] text-error">
              <span className="w-[28px]">
                <ErrorCircleFillIcon />
              </span>
            </div>
            <div className="w-[calc(100%_-_32px)] py-1 pl-1">
              <div className="w-full text-[14px] font-medium first-letter:capitalize">
                {
                  props.code ? <span className="hidden"><pre className="font-mono bg-error-light text-error py-[4px] px-[8px] rounded mr-1 inline-block">{props.code}</pre></span>: ""
                }
                <span className="inline">{props.title}</span>
              </div>
              <div className="w-full text-[12px] text-gray-text first-letter:capitalize">{props.description}
              </div>
            </div>
          </div>
          <div className="w-[20px] justify-end items-center relative">
            
            {/* @ts-ignore */}
            <button width="20px" height="20px" onClick={props.onClose} className=" absolute w-[20px] h-[20px] flex items-center justify-center">
              <span className="w-[14px] h-[14px] absolute top-[15px] mr-[50px]"><CloseIcon /></span>
            </button>
          </div>
        </div>
      );

    default:
      return "";
    }
  };

  let animationClass = "";
  if (toggleNotification !== null) {
    animationClass = toggleNotification ? "slideIn" : "slideOut";
  }

  return (
    <ReactPortal wrapperId="notification">
      <div className={`fixed right-2 top-6 w-[calc(100%_-_20px_-_20px)] rounded-[10px] max-w-[510px] z-[99999] animate ${animationClass}`}>
        {notificationUi()}
      </div>
    </ReactPortal>
  );
};

export default Notification;
