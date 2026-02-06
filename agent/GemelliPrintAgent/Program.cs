using GemelliPrintAgent;
using GemelliPrintAgent.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

var dataPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "GemelliPrintAgent"
);
Directory.CreateDirectory(dataPath);
Directory.CreateDirectory(Path.Combine(dataPath, "logs"));

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.File(
        Path.Combine(dataPath, "logs", "agent-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30
    )
    .CreateLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddWindowsService(options =>
    {
        options.ServiceName = "GemelliPrintAgent";
    });

    builder.Services.AddSerilog();
    builder.Services.AddSingleton<SystemInfoService>();
    builder.Services.AddSingleton<LocalQueueService>();
    builder.Services.AddSingleton<ApiClient>();
    builder.Services.AddHostedService<Worker>();

    var host = builder.Build();
    host.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
