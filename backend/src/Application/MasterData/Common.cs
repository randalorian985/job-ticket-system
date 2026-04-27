namespace JobTicketSystem.Application.MasterData;

public sealed class ValidationException : Exception
{
    public ValidationException(string message) : base(message)
    {
    }
}

public sealed record PagedQuery(int Offset = 0, int Limit = 50)
{
    public int NormalizedOffset => Offset < 0 ? 0 : Offset;
    public int NormalizedLimit => Limit <= 0 ? 50 : Math.Min(Limit, 200);
}
