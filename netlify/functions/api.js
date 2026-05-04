import serverless from "serverless-http";
import app from "../../server/index.js";

const expressHandler = serverless(app);

export async function handler(event, context) {
  const normalizedPath = event.path.replace(/^\/\.netlify\/functions\/api/, "/api");
  return expressHandler({ ...event, path: normalizedPath || "/" }, context);
}
