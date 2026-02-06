using GemelliPrintAgent.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GemelliPrintAgent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly EventLogMonitor _eventLogMonitor;
    private readonly LocalQueueService _queueService;
    private readonly ApiClient _apiClient;

    public Worker(
        ILogger<Worker> logger,
        SystemInfoService systemInfo,
        LocalQueueService queueService,
        ApiClient apiClient)
    {
        _logger = logger;
        _queueService = queueService;
        _apiClient = apiClient;
        _eventLogMonitor = new EventLogMonitor(logger, systemInfo, queueService);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Gemelli Print Agent iniciado");

        _eventLogMonitor.Start();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _apiClient.SendQueuedJobsAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en ciclo principal");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        _eventLogMonitor.Stop();
        _logger.LogInformation("Gemelli Print Agent detenido");
    }
}
