/**
 * Content-Type validation
 * Ensures API requests have the correct Content-Type header
 */

/**
 * Validates that the request has the correct Content-Type header
 * @param request - The incoming request
 * @param allowedTypes - Array of allowed Content-Type values (default: ["application/json"])
 * @returns true if Content-Type is valid, false otherwise
 */
export function validateContentType(
  request: Request,
  allowedTypes: string[] = ["application/json"]
): { valid: boolean; error?: string } {
  const contentType = request.headers.get("content-type");

  // GET, HEAD, DELETE requests typically don't have a body
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "DELETE"].includes(method)) {
    return { valid: true };
  }

  // POST, PUT, PATCH requests should have Content-Type
  if (!contentType) {
    return {
      valid: false,
      error: "Content-Type header is required",
    };
  }

  // Check if Content-Type matches any allowed type
  const isValid = allowedTypes.some((allowedType) => {
    // Handle cases like "application/json; charset=utf-8"
    return contentType.toLowerCase().startsWith(allowedType.toLowerCase());
  });

  if (!isValid) {
    return {
      valid: false,
      error: `Content-Type must be one of: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}
