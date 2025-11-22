import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/code/run
 * Executes C++ code using Judge0 API (or similar code execution service)
 * Returns the output, error, and execution status
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { code, language = "cpp", stdin = "" } = body;

    // Validate required fields
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Only allow C++ for now (can be extended later)
    if (language.toLowerCase() !== "cpp" && language.toLowerCase() !== "c++") {
      return NextResponse.json(
        { error: "Only C++ code execution is currently supported" },
        { status: 400 }
      );
    }

    // Use Judge0 API for code execution (free public instance)
    // You can also set up your own Judge0 instance for better reliability
    const JUDGE0_API_URL =
      process.env.JUDGE0_API_URL || "https://ce.judge0.com";
    const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
    const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

    // Language ID for C++: 54 (C++17)
    const languageId = 54;

    // Prepare request headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If using RapidAPI Judge0 endpoint, add RapidAPI headers
    if (JUDGE0_RAPIDAPI_KEY && JUDGE0_RAPIDAPI_HOST) {
      headers["X-RapidAPI-Key"] = JUDGE0_RAPIDAPI_KEY;
      headers["X-RapidAPI-Host"] = JUDGE0_RAPIDAPI_HOST;
    }

    // Submit code for execution
    const submitResponse = await fetch(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || "",
          // Set execution limits for security
          cpu_time_limit: 5, // 5 seconds
          memory_limit: 128000, // 128 MB
          wall_time_limit: 10, // 10 seconds
        }),
      }
    );

    if (!submitResponse.ok) {
      // If Judge0 API fails, try alternative approach
      // For development, you could use a local Docker-based solution
      const errorText = await submitResponse.text();
      console.error("Judge0 API error:", errorText);

      // Fallback: Return a mock response for development/testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          stdout: "Execution service unavailable in development mode.\nPlease set up Judge0 API or configure a local execution service.",
          stderr: "",
          status: {
            id: 3, // Internal Error
            description: "Execution service unavailable",
          },
          time: "0.00",
          memory: 0,
        });
      }

      return NextResponse.json(
        {
          error: "Code execution service is currently unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    const result = await submitResponse.json();

    // Check execution status
    // Status IDs: 1 (In Queue), 2 (Processing), 3 (Accepted), 4 (Wrong Answer), etc.
    // See Judge0 documentation for all status codes
    let statusDescription = "Unknown";
    if (result.status) {
      const statusId = result.status.id || result.status_id;
      switch (statusId) {
        case 1:
        case 2:
          statusDescription = "Processing";
          break;
        case 3:
          statusDescription = "Accepted";
          break;
        case 4:
          statusDescription = "Wrong Answer";
          break;
        case 5:
          statusDescription = "Time Limit Exceeded";
          break;
        case 6:
          statusDescription = "Compilation Error";
          break;
        case 7:
          statusDescription = "Runtime Error (SIGSEGV)";
          break;
        case 8:
          statusDescription = "Runtime Error (SIGXFSZ)";
          break;
        case 9:
          statusDescription = "Runtime Error (SIGFPE)";
          break;
        case 10:
          statusDescription = "Runtime Error (SIGABRT)";
          break;
        case 11:
          statusDescription = "Runtime Error (NZEC)";
          break;
        case 12:
          statusDescription = "Runtime Error (Other)";
          break;
        case 13:
          statusDescription = "Internal Error";
          break;
        case 14:
          statusDescription = "Exec Format Error";
          break;
        default:
          statusDescription =
            result.status.description || "Unknown Status";
      }
    }

    return NextResponse.json({
      success: true,
      stdout: result.stdout || "",
      stderr: result.stderr || result.compile_output || "",
      status: {
        id: result.status?.id || result.status_id,
        description: statusDescription,
      },
      time: result.time || "0.00",
      memory: result.memory || 0,
      message: result.message || "",
    });
  } catch (error) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute code. Please try again later.",
      },
      { status: 500 }
    );
  }
}

