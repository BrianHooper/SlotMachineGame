namespace SlotMachineGame.Helpers
{
    public class FilePathProvider : IFilePathProvider
    {
        private readonly string ApplicationDirectory;
        private readonly string DatabaseDirectory;
        private readonly string LogDirectory;

        public FilePathProvider()
        {
            var localAppData = Environment.SpecialFolder.LocalApplicationData;
            this.ApplicationDirectory = Path.Join(Environment.GetFolderPath(localAppData), Constants.ApplicationDirectoryName);
            this.DatabaseDirectory = Path.Combine(this.ApplicationDirectory, Constants.DatabaseDirectoryName);
            this.LogDirectory = Path.Combine(this.ApplicationDirectory, Constants.LogDirectoryName);
        }

        public string GetDatabaseFilePath(string filename)
        {
            return Path.Combine(this.DatabaseDirectory, filename);
        }

        public string GetLogFilePath(string filename)
        {
            return Path.Combine(this.LogDirectory, filename);
        }

        public bool ValidateFilepathDirectory(ILogger logger, string filepath)
        {
            try
            {
                var databaseDirectory = Path.GetDirectoryName(filepath);
                if (string.IsNullOrWhiteSpace(databaseDirectory))
                {
                    return false;
                }

                if (!Directory.Exists(databaseDirectory))
                {
                    var directoryInfo = Directory.CreateDirectory(databaseDirectory);
                    logger.LogInformation($"ValidateFilepathDirectory: Created directory \"{directoryInfo.FullName}\", exists: {directoryInfo.Exists}");
                }

                return Directory.Exists(databaseDirectory);
            }
            catch (Exception ex)
            {
                logger.LogError($"ValidateFilepathDirectory exception: {ex.Message}");
                return false;
            }
        }
    }
}
;