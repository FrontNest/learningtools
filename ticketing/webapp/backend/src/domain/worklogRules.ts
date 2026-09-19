import { appConfig } from "../config";
import { AppError } from "../errors/AppError";

// Worklog description limits must be enforced on the backend, not just the UI
// (spec section 14 / master prompt section 15).
export function assertValidWorklogDescription(description: string) {
  const lines = description.split(/\r\n|\r|\n/);
  if (lines.length > appConfig.worklogMaxLines) {
    throw AppError.badRequest(`Worklog description must not exceed ${appConfig.worklogMaxLines} lines`);
  }
  if (description.length > appConfig.worklogMaxChars) {
    throw AppError.badRequest(`Worklog description must not exceed ${appConfig.worklogMaxChars} characters`);
  }
}
