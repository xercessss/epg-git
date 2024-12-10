import { exec } from 'child_process';

export const dynamic = 'force-dynamic'; // Ensure the function runs every time it's called

export default function handler(req, res) {
    exec('npm run grab -- --site=bein.com --lang=en', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(`stdout: ${stdout}`);
        return res.status(200).json({ output: stdout });
    });
}
