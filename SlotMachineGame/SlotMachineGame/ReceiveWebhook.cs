namespace SlotMachineGame
{
    public class ReceiveWebhook : IReceiveWebhook
    {
        public async Task<string> ProcessRequest(string requestBody)
        {
            Console.WriteLine($"Request Body: {requestBody}");
            return "{\"message\" : \"Thanks! We got your webhook\"}";
        }
    }
}
