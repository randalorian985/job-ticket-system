namespace JobTicketSystem.Application.Security;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    Guid EmployeeId { get; }
    string Role { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    bool IsManager { get; }
    bool IsEmployee { get; }
}

public static class SystemRoles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Employee = "Employee";

    public static readonly string[] All = [Admin, Manager, Employee];
}
