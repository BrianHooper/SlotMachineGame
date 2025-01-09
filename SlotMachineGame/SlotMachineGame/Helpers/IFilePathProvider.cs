namespace SlotMachineGame.Helpers
{
    public interface IFilePathProvider
    {
        public string GetDatabaseFilePath(string filename);

        public string GetLogFilePath(string filename);

        public bool ValidateFilepathDirectory(ILogger logger, string filepath);
    }
}
