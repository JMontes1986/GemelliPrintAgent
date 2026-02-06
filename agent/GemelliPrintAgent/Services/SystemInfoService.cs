using System.Net;
using System.Net.Sockets;

namespace GemelliPrintAgent.Services;

public class SystemInfoService
{
    public string PcName { get; }
    public string PcIp { get; }

    public SystemInfoService()
    {
        PcName = Environment.MachineName;
        PcIp = GetLocalIPAddress();
    }

    private static string GetLocalIPAddress()
    {
        var host = Dns.GetHostEntry(Dns.GetHostName());
        foreach (var ip in host.AddressList)
        {
            if (ip.AddressFamily == AddressFamily.InterNetwork && 
                !IPAddress.IsLoopback(ip))
            {
                return ip.ToString();
            }
        }
        return "127.0.0.1";
    }

    public string GetCurrentUsername()
    {
        return Environment.UserName;
    }
}
