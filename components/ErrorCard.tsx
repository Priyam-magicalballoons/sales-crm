import { AlertTriangleIcon } from "lucide-react";
import React from "react";

interface Props {
  errorMessage?: string;
}

const ErrorCard = ({ errorMessage }: Props) => {
  return (
    <div className="flex items-center justify-center h-[calc(100%-200px)]">
      <div className="flex items-center gap-5">
        <AlertTriangleIcon className="text-red-500 size-10" />
        <p className="text-red-500 text-xl">
          {errorMessage ?? "Something went wrong"}
        </p>
      </div>
    </div>
  );
};

export default ErrorCard;
