import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ReactPortalInterface {
  children: React.ReactNode
  wrapperId: string;
}

const createWrapperToBody = (wrapperId:string) => {
  const wrapperElement = document.createElement("div");
  wrapperElement.setAttribute("id", wrapperId);
  document.body.appendChild(wrapperElement);
  return wrapperElement;
};

const ReactPortal = ({children, wrapperId = "outer-block"}:ReactPortalInterface) => {
  const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let element = document.getElementById(wrapperId);
    let systemCreated = false;
    if (!element) {
      systemCreated = true;
      element = createWrapperToBody(wrapperId);
    }
    setWrapperElement(element);
    
    return () => {
      if (systemCreated && element?.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [wrapperId]);

  if (wrapperElement === null) return null;

  return createPortal(children, wrapperElement);
};

export default ReactPortal;
