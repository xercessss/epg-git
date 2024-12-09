export default async function handler(req, res) {
  // Import any necessary modules or commands
  const { exec } = require("child_process");

  // Replace with your actual npm command
  exec("npm run grab -- --site=bein.com --lang=en", (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr });
    }
    res.status(200).json({ output: stdout });
  });
}
