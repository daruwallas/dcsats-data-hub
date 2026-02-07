import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, candidate_id, job_id, job_description, candidate_ids, job_ids } = await req.json();

    // type: "match_one" | "match_resumes" | "reverse_match"
    if (type === "match_one") {
      // Score a single candidate against a single job
      const [candidateRes, jobRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("id", candidate_id).single(),
        supabase.from("jobs").select("*, companies(name, location)").eq("id", job_id).single(),
      ]);
      if (candidateRes.error || jobRes.error) throw new Error("Failed to fetch data");

      const scores = await getAIScores(LOVABLE_API_KEY, candidateRes.data, jobRes.data);
      return json(scores);
    }

    if (type === "match_resumes") {
      // Given a JD text, find and score top candidates
      const { data: candidates } = await supabase.from("candidates").select("*").limit(50);
      if (!candidates?.length) return json({ matches: [] });

      const scores = await scoreMultipleCandidates(LOVABLE_API_KEY, candidates, job_description);
      return json({ matches: scores });
    }

    if (type === "reverse_match") {
      // Given a candidate, find matching jobs
      const { data: candidate } = await supabase.from("candidates").select("*").eq("id", candidate_id).single();
      if (!candidate) throw new Error("Candidate not found");

      const { data: jobs } = await supabase.from("jobs").select("*, companies(name, location)").eq("status", "open").limit(50);
      if (!jobs?.length) return json({ matches: [] });

      const scores = await scoreMultipleJobs(LOVABLE_API_KEY, candidate, jobs);
      return json({ matches: scores });
    }

    if (type === "power_match") {
      // Score a candidate against a job and save the match
      const [candidateRes, jobRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("id", candidate_id).single(),
        supabase.from("jobs").select("*, companies(name, location)").eq("id", job_id).single(),
      ]);
      if (candidateRes.error || jobRes.error) throw new Error("Failed to fetch data");

      const scores = await getAIScores(LOVABLE_API_KEY, candidateRes.data, jobRes.data);

      // Upsert match record
      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .upsert({
          candidate_id,
          job_id,
          overall_score: scores.overall_score,
          skill_score: scores.skill_score,
          experience_score: scores.experience_score,
          education_score: scores.education_score,
          location_score: scores.location_score,
          salary_score: scores.salary_score,
          score_breakdown: scores,
          status: "new",
        }, { onConflict: "candidate_id,job_id" })
        .select()
        .single();

      return json({ match, scores });
    }

    return json({ error: "Invalid type" }, 400);
  } catch (e) {
    console.error("ai-match error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAIScores(apiKey: string, candidate: any, job: any) {
  const prompt = `You are an expert ATS scoring engine. Score this candidate against the job.

CANDIDATE:
- Name: ${candidate.full_name}
- Skills: ${(candidate.skills || []).join(", ") || "Not specified"}
- Experience: ${candidate.experience_years || 0} years
- Current Role: ${candidate.current_designation || "N/A"} at ${candidate.current_company || "N/A"}
- Education: ${candidate.education || "N/A"}
- Location: ${candidate.location || "N/A"}
- Current Salary: ${candidate.current_salary || "N/A"}
- Expected Salary: ${candidate.expected_salary || "N/A"}

JOB:
- Title: ${job.title}
- Company: ${job.companies?.name || "N/A"}
- Required Skills: ${(job.skills || []).join(", ") || "Not specified"}
- Experience Range: ${job.experience_min || 0}-${job.experience_max || "any"} years
- Location: ${job.location || "N/A"}
- Salary Range: ${job.salary_min || "N/A"}-${job.salary_max || "N/A"} ${job.salary_currency || ""}
- Job Type: ${job.job_type || "N/A"}
- Description: ${(job.description || "").slice(0, 500)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an ATS scoring engine. Return structured scores." },
        { role: "user", content: prompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_scores",
          description: "Return matching scores for a candidate-job pair",
          parameters: {
            type: "object",
            properties: {
              overall_score: { type: "number", description: "Overall match 0-100" },
              skill_score: { type: "number", description: "Skills match 0-100" },
              experience_score: { type: "number", description: "Experience match 0-100" },
              education_score: { type: "number", description: "Education match 0-100" },
              location_score: { type: "number", description: "Location match 0-100" },
              salary_score: { type: "number", description: "Salary match 0-100" },
              strengths: { type: "array", items: { type: "string" }, description: "Top 3 strengths" },
              gaps: { type: "array", items: { type: "string" }, description: "Top 3 gaps" },
              recommendation: { type: "string", description: "Brief recommendation (1-2 sentences)" },
            },
            required: ["overall_score", "skill_score", "experience_score", "education_score", "location_score", "salary_score", "strengths", "gaps", "recommendation"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_scores" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    // Return fallback scores
    return fallbackScores();
  }

  const result = await response.json();
  try {
    const toolCall = result.choices[0].message.tool_calls[0];
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return fallbackScores();
  }
}

function fallbackScores() {
  return {
    overall_score: 50,
    skill_score: 50,
    experience_score: 50,
    education_score: 50,
    location_score: 50,
    salary_score: 50,
    strengths: ["Unable to analyze"],
    gaps: ["Unable to analyze"],
    recommendation: "AI analysis unavailable. Please review manually.",
  };
}

async function scoreMultipleCandidates(apiKey: string, candidates: any[], jobDescription: string) {
  const candidateSummaries = candidates.map((c, i) => 
    `[${i}] ${c.full_name} | Skills: ${(c.skills || []).join(",")} | Exp: ${c.experience_years || 0}y | Location: ${c.location || "N/A"}`
  ).join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an ATS matching engine. Score candidates against a job description." },
        { role: "user", content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATES:\n${candidateSummaries}\n\nScore the top 10 most relevant candidates.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_matches",
          description: "Return scored candidate matches",
          parameters: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    score: { type: "number", description: "0-100" },
                    reason: { type: "string" },
                  },
                  required: ["index", "score", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["matches"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_matches" } },
    }),
  });

  if (!response.ok) return [];

  const result = await response.json();
  try {
    const toolCall = result.choices[0].message.tool_calls[0];
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.matches
      .map((m: any) => ({
        candidate: candidates[m.index],
        score: m.score,
        reason: m.reason,
      }))
      .filter((m: any) => m.candidate)
      .sort((a: any, b: any) => b.score - a.score);
  } catch {
    return [];
  }
}

async function scoreMultipleJobs(apiKey: string, candidate: any, jobs: any[]) {
  const jobSummaries = jobs.map((j, i) =>
    `[${i}] ${j.title} at ${j.companies?.name || "N/A"} | Skills: ${(j.skills || []).join(",")} | Exp: ${j.experience_min || 0}-${j.experience_max || "any"}y | Location: ${j.location || "N/A"}`
  ).join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an ATS reverse matching engine. Score jobs against a candidate profile." },
        { role: "user", content: `CANDIDATE:\nName: ${candidate.full_name}\nSkills: ${(candidate.skills || []).join(",")}\nExperience: ${candidate.experience_years || 0} years\nLocation: ${candidate.location || "N/A"}\nCurrent Role: ${candidate.current_designation || "N/A"}\n\nJOBS:\n${jobSummaries}\n\nScore the top 10 most relevant jobs.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_matches",
          description: "Return scored job matches",
          parameters: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    score: { type: "number", description: "0-100" },
                    reason: { type: "string" },
                  },
                  required: ["index", "score", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["matches"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_matches" } },
    }),
  });

  if (!response.ok) return [];

  const result = await response.json();
  try {
    const toolCall = result.choices[0].message.tool_calls[0];
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.matches
      .map((m: any) => ({
        job: jobs[m.index],
        score: m.score,
        reason: m.reason,
      }))
      .filter((m: any) => m.job)
      .sort((a: any, b: any) => b.score - a.score);
  } catch {
    return [];
  }
}
