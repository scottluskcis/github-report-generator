import { CopilotMetrics } from "./metrics/copilot-usage";

export function getMessage(): string {
  return 'Hello world!';
}

const message: string = getMessage();
console.log(message);

export function getMetrics() {
  const metrics = new CopilotMetrics();
  return metrics.getMetrics({}); 
}

getMetrics().then(console.log).catch(console.error);