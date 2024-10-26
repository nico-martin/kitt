import React from "react";
import transcriberContext from "./transcriberContext.ts";

const useTranscriber = () => {
  return React.useContext(transcriberContext);
};

export default useTranscriber;
