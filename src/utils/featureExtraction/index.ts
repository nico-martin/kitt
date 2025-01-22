//import FeatureExtractionGemini from "./FeatureExtractionGemini.ts";
import FeatureExtractionTFJS from "./FeatureExtractionTFJS.ts";

export default new FeatureExtractionTFJS();

/*export default localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY")
  ? new FeatureExtractionGemini()
  : new FeatureExtractionTFJS();*/
