using SlotMachineGame.Helpers;
using System.Text.Json;

namespace SlotMachineGame.Database
{
    public class JsonDatabase<K, V> where K : class where V : class
    {
        private readonly IFilePathProvider FilepPathProvider;
        private readonly ILogger Logger;
        private readonly string DatabasePath;
        private readonly Mutex Mutex;
        private readonly JsonSerializerOptions SerializerOptions = new() { WriteIndented = true };

        public JsonDatabase(IFilePathProvider filepPathProvider, ILogger logger, string filename)
        {
            this.FilepPathProvider = filepPathProvider;
            this.Logger = logger;
            this.DatabasePath = filepPathProvider.GetDatabaseFilePath(filename);
            this.Mutex = new Mutex();
        }

        public bool TryRead(K key, out V? value)
        {
            this.Mutex.WaitOne();
            var databaseData = ReadLocalData();
            var success = databaseData.TryGetValue(key, out value);
            this.Mutex.ReleaseMutex();
            return success;
        }

        public bool TryWrite(K key, V value)
        {
            this.Mutex.WaitOne();
            var databaseData = ReadLocalData();
            databaseData[key] = value;
            var success = WriteLocalData(databaseData);
            this.Mutex.ReleaseMutex();
            return success;
        }

        private bool WriteLocalData(Dictionary<K, V> databaseData)
        {
            if (!databaseData.Any())
            {
                this.Logger.LogWarning("WriteLocalData: Database data is empty");
                return false;
            }

            string json = string.Empty;
            try
            {
                json = JsonSerializer.Serialize(databaseData, SerializerOptions);
            }
            catch (Exception ex)
            {
                this.Logger.LogError($"WriteLocalData: Exception serializing database data: {ex.Message}");
                return false;
            }

            if (string.IsNullOrWhiteSpace(json))
            {
                this.Logger.LogError("WriteLocalData: Serialized database data is empty");
                return false;
            }

            if (!this.FilepPathProvider.ValidateFilepathDirectory(this.Logger, this.DatabasePath))
            {
                this.Logger.LogError($"WriteLocalData: failed to validate directory");
                return false;
            }

            try
            {
                File.WriteAllText(this.DatabasePath, json);
            }
            catch (Exception ex)
            {
                this.Logger.LogError($"WriteLocalData: Exception writing to file: {ex.Message}");
                return false;
            }

            this.Logger.LogInformation($"WriteLocalData: Wrote {databaseData.Count} entries to file.");
            return true;
        }



        private Dictionary<K, V> ReadLocalData() 
        {
            if (!File.Exists(DatabasePath))
            {
                this.Logger.LogInformation("ReadLocalData: Database file not found on disk");
                return new ();
            }

            string json = string.Empty;
            try
            {
                json = File.ReadAllText(DatabasePath);
            }
            catch (Exception ex)
            {
                this.Logger.LogError($"ReadLocalData: Exception reading database file: {ex.Message}");
                return new();
            }

            if (string.IsNullOrWhiteSpace(json))
            {
                this.Logger.LogError("ReadLocalData: Database file is empty");
                return new();
            }

            Dictionary<K, V>? databaseData = null;
            try
            {
                databaseData = JsonSerializer.Deserialize<Dictionary<K, V>>(json);
            }
            catch (Exception ex)
            {
                this.Logger.LogError($"ReadLocalData: Exception deserializing database file: {ex.Message}");
                return new();
            }

            if (databaseData == null)
            {
                this.Logger.LogError($"ReadLocalData: Deserialized database data is null");
                return new();
            }

            this.Logger.LogInformation($"ReadLocalData: Read {databaseData.Count} entries from database");
            return databaseData;
        }
    }
}
