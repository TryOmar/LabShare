import { useState } from "react";
import type { ExecutionResult } from "@/lib/submission/types";

interface UseCodeExecutionResult {
  userInput: string;
  executionResult: ExecutionResult | null;
  setUserInput: (value: string) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  resetExecution: () => void;
}

/**
 * Hook to manage code execution state
 */
export function useCodeExecution(): UseCodeExecutionResult {
  const [userInput, setUserInput] = useState("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const resetExecution = () => {
    setUserInput("");
    setExecutionResult(null);
  };

  return {
    userInput,
    executionResult,
    setUserInput,
    setExecutionResult,
    resetExecution,
  };
}

