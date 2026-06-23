import EmptyResult from "../Icons/EmptyResult";

interface ErrorInterface {
  title?: string;
  description?: string;
  code?: string | number;
  icon?: any;
}

const ErrorUI = ({title, description, code, icon}:ErrorInterface) => {

  return (
    <div className="w-full h-min-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-y-1">
        <span className="max-w-[110px] max-h-[132px]">
          {
            icon || <EmptyResult />
          }
        </span>
        <div className="w-full flex flex-col justify-center text-[1.8rem]">
          <span className="pr-2 md:pr-1 text-center">&nbsp;{code ?? ""}!</span>
          <span className="text-center text-[18px]">{title ?? ""}</span>
        </div>
        <div className="w-full flex flex-row justify-center items-centertext-lg">
          {description ?? ""}
        </div>
      </div>
    </div>
  );
};

export default ErrorUI;
