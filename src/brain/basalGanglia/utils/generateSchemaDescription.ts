import { z } from "zod";

export const getFieldType = (
  fieldSchema: z.ZodType<any>
): "number" | "string" | "boolean" | "unknown" => {
  if (fieldSchema instanceof z.ZodNumber) {
    return "number";
  } else if (fieldSchema instanceof z.ZodString) {
    return "string";
  } else if (fieldSchema instanceof z.ZodBoolean) {
    return "boolean";
  } else if (fieldSchema instanceof z.ZodOptional) {
    return getFieldType(fieldSchema.unwrap());
  } else if (fieldSchema instanceof z.ZodTransformer) {
    return getFieldType(fieldSchema._def.schema);
  } else {
    return "unknown";
  }
};

const generateSchemaDescription = (schema: z.ZodObject<any>): Array<string> => {
  const descriptions: Array<string> = [];

  for (const key in schema.shape) {
    const fieldSchema = schema.shape[key];
    const fieldDescription = fieldSchema.description || "";
    const fieldType = getFieldType(fieldSchema);
    const optional = fieldSchema instanceof z.ZodOptional;

    descriptions.push(
      [
        `${key}:`,
        `${fieldType} (${optional ? "optional" : "required"})`,
        fieldDescription ? `// ${fieldDescription}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  return descriptions;
};

export default generateSchemaDescription;
