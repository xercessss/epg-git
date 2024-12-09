// /api/redeploy.js
export default async function handler(req, res) {
    const deploymentId = "h597k1b1h"; // Replace with your actual deployment ID
    const response = await fetch(`https://api.vercel.com/v1/deployments/${deploymentId}/redeploy`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`, // Use your Vercel token
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        res.status(200).json({ message: 'Redeployment triggered successfully' });
    } else {
        res.status(response.status).json({ error: 'Failed to trigger redeployment' });
    }
}
