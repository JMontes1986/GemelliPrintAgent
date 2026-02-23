using System.Diagnostics.Eventing.Reader;
using System.Management;
using System.Net;
using System.Text.RegularExpressions;
using GemelliPrintAgent.Models;
using Microsoft.Extensions.Logging;

namespace GemelliPrintAgent.Services;

public class EventLogMonitor
{
    private readonly ILogger _logger;
    private readonly SystemInfoService _systemInfo;
    private readonly LocalQueueService _queueService;
    private EventLogWatcher? _watcher;
    private readonly HashSet<long> _processedRecordIds = new();
    private readonly Dictionary<string, string?> _printerConnectionCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _recordLock = new();
    
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
            CollectRecentEvents(TimeSpan.FromMinutes(30), 300);
            
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
            if (!TryMarkRecordAsProcessed(e.EventRecord.RecordId)) return;
            
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

    public void CollectRecentEvents(TimeSpan lookback, int maxEvents)
    {
        try
        {
            var query = new EventLogQuery(
                "Microsoft-Windows-PrintService/Operational",
                PathType.LogName,
                "*[System[(EventID=307)]]"
            )
            {
                ReverseDirection = true
            };

            using var reader = new EventLogReader(query);
            var threshold = DateTime.Now.Subtract(lookback);
            var processed = 0;

            while (processed < maxEvents)
            {
                using var record = reader.ReadEvent();
                if (record == null) break;
                if (record.TimeCreated.HasValue && record.TimeCreated.Value < threshold) break;
                if (!TryMarkRecordAsProcessed(record.RecordId)) continue;

                var printJob = ParseEventRecord(record);
                if (printJob == null) continue;

                _queueService.EnqueueJob(printJob);
                processed++;
            }

            if (processed > 0)
            {
                _logger.LogInformation(
                    "Se recuperaron {Count} eventos de impresión recientes",
                    processed
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudieron recuperar eventos recientes");
        }
    }

    private PrintJob? ParseEventRecord(EventRecord record)
    {
        try
        {
            var properties = record.Properties.Select(p => p.Value?.ToString() ?? "").ToList();

            if (properties.Count < 6) return null;

            var printerName = properties.ElementAtOrDefault(5) ?? "Unknown";
            
            return new PrintJob
            {
                Timestamp = record.TimeCreated ?? DateTime.Now,
                PcName = _systemInfo.PcName,
                PcIp = _systemInfo.PcIp,
                UsernameWindows = properties.ElementAtOrDefault(2) ?? Environment.UserName,
                PrinterName = printerName,
                PrinterConnection = ResolvePrinterConnection(printerName),
                JobId = properties.ElementAtOrDefault(0) ?? null,
                DocumentName = SanitizeDocumentName(properties.ElementAtOrDefault(1)),
                PagesPrinted = ParseInt(properties.ElementAtOrDefault(7) ?? properties.ElementAtOrDefault(6), 1),
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

    private string? ResolvePrinterConnection(string? printerName)
    {
        if (string.IsNullOrWhiteSpace(printerName)) return null;

        if (_printerConnectionCache.TryGetValue(printerName, out var cachedConnection))
        {
            return cachedConnection;
        }

        try
        {
            var safeName = printerName.Replace("\\", "\\\\").Replace("\"", "\\\"");
            using var searcher = new ManagementObjectSearcher(
                $"SELECT PortName FROM Win32_Printer WHERE Name = \"{safeName}\""
            );

            foreach (ManagementObject printer in searcher.Get())
            {
                var portName = printer["PortName"]?.ToString()?.Trim();
                var normalized = NormalizeConnection(portName);
                _printerConnectionCache[printerName] = normalized;
                return normalized;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "No fue posible resolver conexión para la impresora {Printer}", printerName);
        }

        _printerConnectionCache[printerName] = null;
        return null;
    }

    private static string? NormalizeConnection(string? portName)
    {
        if (string.IsNullOrWhiteSpace(portName)) return null;

        var trimmed = portName.Trim();

        if (trimmed.StartsWith("USB", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed.ToUpperInvariant();
        }

        if (IPAddress.TryParse(trimmed, out _))
        {
            return trimmed;
        }

        var ipMatch = Regex.Match(trimmed, @"(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)");
        if (ipMatch.Success && IPAddress.TryParse(ipMatch.Value, out _))
        {
            return ipMatch.Value;
        }

        return trimmed;
    }
    
    private static int ParseInt(string? value, int defaultValue)
    {
        return int.TryParse(value, out var result) ? result : defaultValue;
    }

    private bool TryMarkRecordAsProcessed(long? recordId)
    {
        if (!recordId.HasValue) return true;

        lock (_recordLock)
        {
            return _processedRecordIds.Add(recordId.Value);
        }
    }
}
