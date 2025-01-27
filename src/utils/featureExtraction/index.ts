//import FeatureExtractionGemini from "./FeatureExtractionGemini.ts";
import FeatureExtractionTransformers from "./FeatureExtractionTransformers.ts";

export default new FeatureExtractionTransformers();

/*export default localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY")
  ? new FeatureExtractionGemini()
  : new FeatureExtractionTFJS();*/
