using System;
using System.Security.Cryptography;
using System.Text;
[assembly: System.Reflection.AssemblyTitle("CompetitorLens credential helper")]
[assembly: System.Reflection.AssemblyVersion("1.5.0.0")]
internal static class CredentialHelper {
  private static int Main(string[] args) {
    try {
      byte[] input=Convert.FromBase64String(Console.In.ReadToEnd().Trim());
      byte[] entropy=Encoding.UTF8.GetBytes("CompetitorLens credential vault v1");
      byte[] output=args.Length==1&&args[0]=="protect"?ProtectedData.Protect(input,entropy,DataProtectionScope.CurrentUser):args.Length==1&&args[0]=="unprotect"?ProtectedData.Unprotect(input,entropy,DataProtectionScope.CurrentUser):null;
      if(output==null)return 2;
      Console.Out.Write(Convert.ToBase64String(output));Array.Clear(input,0,input.Length);Array.Clear(output,0,output.Length);return 0;
    } catch { Console.Error.Write("Credential protection failed.");return 1; }
  }
}
