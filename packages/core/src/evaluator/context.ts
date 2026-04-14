import { resolve } from "node:path";

export interface EvaluationContext {
  projectPath: string;
}

export function createEvaluationContext(projectPath: string): EvaluationContext {
  return {
    projectPath: resolve(projectPath),
  };
}
