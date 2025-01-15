using Serilog.Events;
using Serilog;
using SlotMachineGame.Database;
using SlotMachineGame.Helpers;
using SlotMachineGame.CardReader;

namespace SlotMachineGame
{
    public class Program
    {

        public void Run(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Host.UseSerilog();

            // Add services to the container.
            builder.Services.AddControllersWithViews();

            builder.Services.AddSingleton<IFilePathProvider, FilePathProvider>();
            builder.Services.AddSingleton<IPlayerDatabase, PlayerDatabase>();
            builder.Services.AddSingleton<SerialReader>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.SetupLogger();

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthorization();

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            var x = app.Services.GetService<SerialReader>();
            if (x != null)
            {
                x.StartAsync(new CancellationToken());
            }
            app.Run();
        }

        public static void Main(string[] args)
        {
            var program = new Program();
            program.Run(args);
        }
    }
}