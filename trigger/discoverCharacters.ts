import {
  discoverCharactersKickoffSchema,
  type DiscoverCharactersKickoff,
} from "@libra/shared";

export const discoverCharactersWorkflowId = "discover-characters";

export type DiscoverCharactersWorkflowPayload = DiscoverCharactersKickoff;

export function createDiscoverCharactersPayload(
  input: DiscoverCharactersWorkflowPayload,
): DiscoverCharactersWorkflowPayload {
  return discoverCharactersKickoffSchema.parse(input);
}
