/**
 * Split payload evidence into request vs response lists for the overview panels.
 */

import type { SoftwareGraphEvidence } from "../../types";

export function splitPayloadEvidence(payloadEvidence: SoftwareGraphEvidence[]): {
  request: SoftwareGraphEvidence[];
  response: SoftwareGraphEvidence[];
} {
  const request: SoftwareGraphEvidence[] = [];
  const response: SoftwareGraphEvidence[] = [];

  for (const entry of payloadEvidence) {
    const kind = entry.kind || "";
    const isRequest = /request/i.test(kind);
    const isResponse = /response/i.test(kind);
    if (isResponse && !isRequest) {
      response.push(entry);
      continue;
    }
    // Explicit requests and remaining payload kinds stay visible under request.
    request.push(entry);
  }

  return { request, response };
}
