using System.Diagnostics.Eventing.Reader;
using GemelliPrintAgent.Models;
using Microsoft.Extensions.Logging;

namespace GemelliPrintAgent.Services;

public class EventLogMonitor
{
    private readonly ILogger _logger;
    private readonly SystemInfoService _systemInfo;
    private readonly LocalQueueService _queueService;
    private EventLogWatcher? _watcher;

    public EventLogMonitor(
        ILogger logger,
        SystemInfoService systemInfo,
        LocalQueueService queueService)
    {
        _logger = logger;
        _systemInfo = systemInfo;
        _queueService = queueService;
    }

    public void Start()
    {
        try
        {
            var query = new EventLogQuery(
                "Microsoft-Windows-PrintService/Operational",
                PathType.LogName,
                "*[System[(EventID=307)]]"
            );

            _watcher = new EventLogWatcher(query);
            _watcher.EventRecordWritten += OnEventRecordWritten;
            _watcher.Enabled = true;

            _logger.LogInformation("EventLog monitor iniciado");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error iniciando EventLog monitor");
        }
    }

    public void Stop()
    {
        if (_watcher != null)
        {
            _watcher.Enabled = false;
            _watcher.Dispose();
        }
    }

    private void OnEventRecordWritten(object? sender, EventRecordWrittenEventArgs e)
    {
        try
        {
            if (e.EventRecord == null) return;

            var printJob = ParseEventRecord(e.EventRecord);
            if (printJob != null)
            {
                _queueService.EnqueueJob(printJob);
                _logger.LogInformation(
                    "Job capturado: {Document} - {Pages} páginas",
                    printJob.DocumentName,
                    printJob.PagesPrinted
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando evento");
        }
    }

    private PrintJob? ParseEventRecord(EventRecord record)
    {
        try
        {
            var properties = record.Properties.Select(p => p.Value?.ToString() ?? "").ToList();

            if (properties.Count < 8) return null;

            return new PrintJob
            {
                Timestamp = record.TimeCreated ?? DateTime.Now,
                PcName = _systemInfo.PcName,
                PcIp = _systemInfo.PcIp,
                UsernameWindows = properties.ElementAtOrDefault(2) ?? Environment.UserName,
                PrinterName = properties.ElementAtOrDefault(5) ?? "Unknown",
                JobId = properties.ElementAtOrDefault(0) ?? null,
                DocumentName = SanitizeDocumentName(properties.ElementAtOrDefault(1)),
                PagesPrinted = ParseInt(properties.ElementAtOrDefault(7), 1),
                Copies = ParseInt(properties.ElementAtOrDefault(6), 1),
                Status = "completed"
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parseando evento");
            return null;
        }
    }

    private static string SanitizeDocumentName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "N/D";
        return name.Length > 255 ? name.Substring(0, 255) : name;
    }

    private static int ParseInt(string? value, int defaultValue)
    {
        return int.TryParse(value, out var result) ? result : defaultValue;
    }
}
