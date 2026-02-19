using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GemelliPrintAgent.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GemelliPrintAgent.Services;

public class ApiClient
{
    private readonly ILogger<ApiClient> _logger;
    private readonly LocalQueueService _queueService;
    private readonly SystemInfoService _systemInfo;
    private readonly HttpClient _httpClient;
    private readonly string _apiBaseUrl;
    private readonly string _agentToken;

    public ApiClient(
        ILogger<ApiClient> logger,
        IConfiguration configuration,
        LocalQueueService queueService,
        SystemInfoService systemInfo)
    {
        _logger = logger;
        _queueService = queueService;
        _systemInfo = systemInfo;
        _httpClient = new HttpClient();
        
        _apiBaseUrl = (configuration["ApiBaseUrl"] ?? "").TrimEnd('/');
        _agentToken = configuration["AgentToken"] ?? "";

        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", _agentToken);
    }

    public async Task SendHeartbeatAsync(CancellationToken cancellationToken)
    {
        if (!IsApiConfigurationValid()) return;

        try
        {
            var payload = new
            {
                pcName = _systemInfo.PcName,
                pcIp = _systemInfo.PcIp
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"{_apiBaseUrl}/api/agents/heartbeat",
                content,
                cancellationToken
            );

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Heartbeat enviado correctamente");
            }
            else
            {
                _logger.LogWarning("Error en heartbeat. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando heartbeat");
        }
    }

    public async Task SendQueuedJobsAsync(CancellationToken cancellationToken)
    {
        if (!IsApiConfigurationValid()) return;
        
        var pendingJobs = _queueService.GetPendingJobs(50);
        
        if (pendingJobs.Count == 0) return;

        try
        {
            var payload = new { jobs = pendingJobs };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"{_apiBaseUrl}/api/print-jobs",
                content,
                cancellationToken
            );

            if (response.IsSuccessStatusCode)
            {
                var ids = pendingJobs.Select(j => j.Id).ToList();
                _queueService.MarkAsSent(ids);
                _logger.LogInformation("Enviados {Count} jobs correctamente", ids.Count);
            }
            else
            {
                _logger.LogWarning("Error enviando jobs. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comunicándose con API");
        }

        _queueService.DeleteSentJobs(30);
    }

    private bool IsApiConfigurationValid()
    {
        if (string.IsNullOrWhiteSpace(_apiBaseUrl) ||
            _apiBaseUrl.Contains("your-vercel-app.vercel.app", StringComparison.OrdinalIgnoreCase) ||
            _apiBaseUrl.Contains("tu-app.vercel.app", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("ApiBaseUrl no configurada.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(_agentToken))
        {
            _logger.LogError("AgentToken no configurado.");
            return false;
        }

        return true;
    }
}
