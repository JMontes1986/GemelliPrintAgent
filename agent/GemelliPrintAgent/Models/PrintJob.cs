namespace GemelliPrintAgent.Models;

public class PrintJob
{
    public DateTime Timestamp { get; set; }
    public string PcName { get; set; } = "";
    public string PcIp { get; set; } = "";
    public string UsernameWindows { get; set; } = "";
    public string PrinterName { get; set; } = "";
    public string? PrinterConnection { get; set; }
    public string? JobId { get; set; }
    public string DocumentName { get; set; } = "N/D";
    public int PagesPrinted { get; set; }
    public int Copies { get; set; } = 1;
    public bool? Duplex { get; set; }
    public bool? Color { get; set; }
    public string Status { get; set; } = "submitted";
}
