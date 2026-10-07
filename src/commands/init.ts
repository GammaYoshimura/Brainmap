export const INIT_SUCCESS = 0;
export const INIT_FAILURE = 1;

export function initCommand(args: string[] = []): number {
  console.log("Initializing Brainmap...");
  return INIT_SUCCESS;
}
