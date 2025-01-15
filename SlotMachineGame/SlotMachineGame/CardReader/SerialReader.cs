using SlotMachineGame.Database;
using System.IO.Ports;

namespace SlotMachineGame.CardReader
{
    public class SerialReader : BackgroundService
    {
        private const int BaudRate = 9600;
        private const string TagPrefix = "TAG:  ";

        private readonly ILogger<SerialReader> Logger;
        private readonly IPlayerDatabase PlayerDatabase;

        private SerialPort? CurrentPort;
        private Mutex Mutex;

        public SerialReader(ILogger<SerialReader> logger, IPlayerDatabase playerDatabase)
        {
            this.Logger = logger;
            this.PlayerDatabase = playerDatabase;
            this.Mutex = new Mutex(false);
        }

        private void Init()
        {
            this.Logger.LogInformation("Attempting to connect to serial port");
            if (!TryGetSerialPort(out var port))
            {
                this.Logger.LogInformation("Attempted to connect to serial port, but no valid port found");
                return;
            }

            if (port == null)
            {
                this.Logger.LogInformation("Attempted to connect to serial port, but port is null");
                return;
            }

            this.CurrentPort = port;
            this.Logger.LogInformation($"Connected to serial port {this.CurrentPort.PortName}");
        }

        private void DataReceivedHandler(object sender, SerialDataReceivedEventArgs e)
        {
            if (CurrentPort == null || !CurrentPort.IsOpen || CurrentPort.BytesToRead == 0)
            {
                return;
            }

            this.Mutex.WaitOne();
            var line = string.Empty;
            try
            {
                line = this.CurrentPort.ReadLine();
            }
            catch (Exception ex)
            {
                this.Logger.LogError(ex, "Failed to read serial port");
                this.Mutex.ReleaseMutex();
                return;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                this.Mutex.ReleaseMutex();
                return;
            }

            line = line.Trim();
            if (line.StartsWith(TagPrefix))
            {
                var tag = line.Substring(TagPrefix.Length);
                this.Logger.LogInformation($"Recieved tag: \"{tag}\"");
                this.PlayerDatabase.SetCurrentPlayer(tag);
            }
            else
            {
                this.Logger.LogInformation($"Recieved unknown serial message: \"{line}\"");
            }
            
            Thread.Sleep(TimeSpan.FromSeconds(3));

            try
            {
                if (this.CurrentPort.BytesToRead > 0)
                {
                    this.CurrentPort.ReadExisting();
                }
            }
            catch (Exception ex)
            {
                this.Logger.LogError(ex, "Failed to flush serial port");
            }

            this.Mutex.ReleaseMutex();
        }

        private bool TryGetSerialPort(string portName, out SerialPort? port)
        {
            try
            {
                var t = File.Exists(portName);
                port = new SerialPort(portName, BaudRate);
                port.Open();
                port.DataReceived += DataReceivedHandler;
                return port.IsOpen;
            }
            catch (Exception ex)
            {
                port = null;
                return false;
            }
        }

        private bool TryGetSerialPort(out SerialPort? port)
        {
            var ports = SerialPort.GetPortNames();
            foreach (var portName in ports)
            {
                if (TryGetSerialPort(portName, out port))
                {
                    return port != null;
                }
            }
            port = null;
            return false;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                if (CurrentPort == null || !CurrentPort.IsOpen)
                {
                    this.Init();
                }

                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
