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
    private readonly HttpClient _httpClient;
    private readonly string _apiBaseUrl;
    private readonly string _agentToken;

    public ApiClient(
        ILogger<ApiClient> logger,
        IConfiguration configuration,
        LocalQueueService queueService)
    {
        _logger = logger;
        _queueService = queueService;
        _httpClient = new HttpClient();
        
        _apiBaseUrl = configuration["ApiBaseUrl"] ?? "https://your-vercel-app.vercel.app";
        _agentToken = configuration["AgentToken"] ?? "";

        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", _agentToken);
    }

    public async Task SendQueuedJobsAsync(CancellationToken cancellationToken)
    {
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
                _logger.LogWarning(
                    "Error enviando jobs. Status: {Status}",
                    response.StatusCode
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comunicándose con API");
        }

        _queueService.DeleteSentJobs(30);
    }
}
