/* import { exec } from 'child_process';

export default function handler(req, res) {
  const site = req.query.site || 'bein.com'; // Default site

  exec(`npm run grab -- --site=${site} --lang=en`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing grab: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`Grab output: ${stdout}`);
    return res.status(200).json({ message: 'EPG grabbed successfully', output: stdout });
  });
}
*/
