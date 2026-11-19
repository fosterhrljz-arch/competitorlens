using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
[assembly: System.Reflection.AssemblyTitle("CompetitorLens V1.5")]
[assembly: System.Reflection.AssemblyVersion("1.5.0.0")]
internal static class Launcher {
  [STAThread]
  private static void Main() {
    string root=AppDomain.CurrentDomain.BaseDirectory;
    string runtime=Path.Combine(root,"runtime","node.exe");
    if(!File.Exists(runtime)||!File.Exists(Path.Combine(root,"CompetitorLens.html"))) {
      MessageBox.Show("Extract the complete CompetitorLens Windows package before launching. The runtime or application file is missing.\n\n请先完整解压 CompetitorLens Windows 安装包。当前缺少运行环境或应用文件。","CompetitorLens",MessageBoxButtons.OK,MessageBoxIcon.Information);return;
    }
    try {
      var info=new ProcessStartInfo(runtime,"service/launch.mjs");
      info.WorkingDirectory=root;info.UseShellExecute=false;info.CreateNoWindow=true;
      using(var process=Process.Start(info)) {
        if(process.WaitForExit(4000)&&process.ExitCode!=0) {
          string log=Path.Combine(root,"launch-error.txt");
          MessageBox.Show((File.Exists(log)?File.ReadAllText(log):"The local service could not start. Double-click CompetitorLens.html for manual research, or consult the README.")+"\n\n本地服务无法启动。请查看 README；也可双击 CompetitorLens.html 使用手动研究。","CompetitorLens",MessageBoxButtons.OK,MessageBoxIcon.Warning);
        }
      }
    } catch(Exception ex) { MessageBox.Show("Unable to launch the bundled local service. 无法启动本地服务。 "+ex.Message,"CompetitorLens",MessageBoxButtons.OK,MessageBoxIcon.Warning); }
  }
}
