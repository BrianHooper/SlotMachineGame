using Serilog.Events;
using Serilog;

namespace SlotMachineGame
{
    public static class WebApplicationExtensions
    {
        public static void SetupLogger(this WebApplication host)
        {
            var webHostEnv = host.Services.GetService<IHostEnvironment>();
            if (webHostEnv == null)
            {
                throw new ArgumentNullException(nameof(webHostEnv));
            }

            var logOutputTemplate = "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] ({SourceContext}) {Message}{NewLine}{Exception}";

            var loggerBootstrap = new LoggerConfiguration();
            loggerBootstrap
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .WriteTo.Console(outputTemplate: logOutputTemplate)
                .WriteTo.File(
                    System.IO.Path.Combine(webHostEnv.ContentRootPath, "LogFiles", "Log_.txt"),
                    rollingInterval: RollingInterval.Day,
                    fileSizeLimitBytes: 10 * 1024 * 1024,
                    retainedFileCountLimit: 2,
                    rollOnFileSizeLimit: true,
                    shared: true,
                    flushToDiskInterval: TimeSpan.FromSeconds(1),
                    outputTemplate: logOutputTemplate);
            Log.Logger = loggerBootstrap.CreateLogger();
        }
    }
}
