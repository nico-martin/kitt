//import FeatureExtractionGemini from "./FeatureExtractionGemini.ts";
import Reranker from "./Reranker.ts";

export default new Reranker((...data) => console.log("[reranker]", ...data));

/*export default localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY")
  ? new FeatureExtractionGemini()
  : new FeatureExtractionTFJS();*/
