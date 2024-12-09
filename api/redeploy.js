export default async function handler(req, res) {
  try {
    // Logic to trigger your build, e.g., hitting Vercel's Deployment API
    res.status(200).send("Build triggered!");
  } catch (err) {
    console.error("Error triggering build:", err);
    res.status(500).send("Failed to trigger build");
  }
}
