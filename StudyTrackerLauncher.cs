using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace StudyTrackerApp
{
    class Program
    {
        static void Main(string[] args)
        {
            // Get the directory where this executable is located
            string appDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            // Set up the process info to silently run npm
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = "cmd.exe";
            startInfo.Arguments = "/c npm run desktop";
            startInfo.WorkingDirectory = appDir; // Ensure we run in the right Next.js folder
            startInfo.CreateNoWindow = true; // HIDES THE TERMINAL!
            startInfo.UseShellExecute = false;

            try
            {
                // Launch the Next.js+Electron architecture invisibly
                Process process = new Process();
                process.StartInfo = startInfo;
                process.Start();
            }
            catch (Exception ex)
            {
                // Failsafe logging just in case
                File.WriteAllText(Path.Combine(appDir, "crash-log.txt"), ex.ToString());
            }
        }
    }
}
