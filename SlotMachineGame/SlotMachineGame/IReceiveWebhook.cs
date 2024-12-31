namespace SlotMachineGame
{
    public interface IReceiveWebhook
    {
        Task<string> ProcessRequest(string requestBody);
    }
}
