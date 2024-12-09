export default async function handler(req, res) {
  const VERCEL_TOKEN = "MOl6g2otBr9VlKFwYptyGJIa";
  const PROJECT_NAME = "epg-git";
  const TEAM_ID = ""; // Optional if you're using a team

  try {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: PROJECT_NAME,
          target: "production",
          teamId: TEAM_ID,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message || "Deployment failed");
    }

    res.status(200).json({ message: "Deployment triggered!", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
