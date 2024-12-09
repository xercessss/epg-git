const fetch = require("node-fetch");

export default async function triggerDeployment(req, res) {
  const VERCEL_API_URL = "https://api.vercel.com/v13/deployments";
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // Ensure this is set in your environment variables
  const PROJECT_NAME = "epg-git";
  const TEAM_ID = ""; // Optional if not in a team

  const payload = {
    name: PROJECT_NAME,
    target: "production",
    // No "files" field unless required
  };

  try {
    const response = await fetch(VERCEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Deployment failed");
    }

    console.log("Deployment triggered successfully:", data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error triggering deployment:", error);
    res.status(500).json({ error: "Error triggering deployment" });
  }
}
export default function handler(req, res) {
  res.status(200).json({ message: "API route is working!" });
}




