import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Default API endpoint handler
 * Provides information about the API's purpose
 *
 * @param req - Vercel HTTP request object
 * @param res - Vercel HTTP response object
 * @returns JSON response with API description message
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Return a 200 status with informational message about the API's purpose
  return res.status(200).json({
    message:
      "This API endpoint is created for checking transactions made in January 2025 on the Cyber network",
  });
}
