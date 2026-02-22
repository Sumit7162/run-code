import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, stdin } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Wandbox API to compile and run C++ code
    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        stdin: stdin || "",
        compiler: "gcc-head",
        options: "warning,gnu++2b",
        "compiler-option-raw": "-O2",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: `Compiler service error: ${text}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    const output = result.program_output || "";
    const compileError = result.compiler_error || "";
    const compilerMessage = result.compiler_message || "";
    const programError = result.program_error || "";
    const status = result.status || "0";

    // Determine if there was a compilation failure
    const hasCompileError = compileError && !output && status !== "0";

    return new Response(
      JSON.stringify({
        output: output || (hasCompileError ? "" : "(no output)"),
        compileError: hasCompileError ? (compileError || compilerMessage) : "",
        runtimeError: programError,
        exitCode: parseInt(status),
        success: !hasCompileError && status === "0",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
